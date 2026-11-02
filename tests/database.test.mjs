import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// PostgreSQL efetivo em memória. Estes esquemas representam apenas a fronteira com Auth e Storage.
test("migração, integridade relacional, isolamento e auditoria", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(name text, bucket_id text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant select, insert on storage.objects to authenticated;
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20261102000100_school.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/20261102000200_rotina.sql", import.meta.url), "utf8"));
    const [school, other, owner, peer, outsider, teacher, year, request, task] = Array.from({length:9}, () => randomUUID());
    await db.query("insert into schools(id,name) values ($1,'A'),($2,'B')",[school,other]);
    await db.query("insert into auth.users values ($1),($2),($3)",[owner,peer,outsider]);
    await db.query("insert into school_memberships(school_id,user_id) values ($1,$2),($1,$3)",[school,owner,peer]);
    await db.query("insert into academic_years(id,school_id,year) values ($1,$2,2026)",[year,school]);
    await db.query("insert into teachers(id,school_id,name) values ($1,$2,'Ana')",[teacher,school]);
    await db.query("insert into material_requests(id,school_id,year_id,title) values ($1,$2,$3,'Planos')",[request,school,year]);
    const insertDelivery = "insert into delivery_obligations(school_id,request_id,teacher_id) values ($1,$2,$3)";
    await db.query(insertDelivery,[school,request,teacher]);
    await assert.rejects(db.query(insertDelivery,[school,request,teacher]),{code:"23505"});
    const foreignTeacher = randomUUID();
    await db.query("insert into teachers(id,school_id,name) values ($1,$2,'Outra escola')",[foreignTeacher,other]);
    await assert.rejects(db.query(insertDelivery,[school,request,foreignTeacher]),{code:"23503"});
    await assert.rejects(db.query("insert into material_requests(school_id,year_id,title) values ($1,$2,'X')",[other,year]),{code:"23503"});
    await db.query("insert into tasks(id,school_id,owner_id,title,area) values ($1,$2,$3,'Revisar','pessoal')",[task,school,owner]);
    await assert.rejects(db.query("update tasks set status='concluida' where id=$1",[task]),{code:"23514"});
    const version = randomUUID();
    const attachment = randomUUID();
    const path = [school,version,attachment].join("/");
    await db.query("insert into receipt_versions(id,school_id,obligation_id,version,received_at,channel) select $1,school_id,id,1,now(),'papel' from delivery_obligations",[version]);
    await db.query("insert into attachments(id,school_id,version_id,object_path,file_name,mime_type,byte_size) values ($1,$2,$3,$4,'plano.pdf','application/pdf',128)",[attachment,school,version,path]);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from schools"),{code:"42501"});
    await db.exec("reset role; set role authenticated");
    for (const [user, schools, tasks] of [[owner,1,1],[peer,1,0],[outsider,0,0]]) {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
      assert.equal((await db.query("select id from schools")).rows.length,schools);
      assert.equal((await db.query("select id from tasks")).rows.length,tasks);
      if (user!==owner) await assert.rejects(db.query("select task_transition($1,$2,1,'complete',true,null)",[school,task]),/indisponível/);
      assert.equal((await db.query("select id from audit_events where entity='tasks'")).rows.length,tasks);
      if (user === owner) await db.query("insert into storage.objects values ($1,'materiais')",[path]);
      assert.equal((await db.query("select name from storage.objects")).rows.length,schools);
      if (user === outsider) await assert.rejects(db.query("insert into storage.objects values ($1,'materiais')",[path]),{code:"42501"});
      await assert.rejects(db.query("insert into storage.objects values ('caminho-alheio','materiais')"),{code:"42501"});
      await assert.rejects(db.query("delete from audit_events"),{code:"42501"});
      await assert.rejects(db.query("insert into school_memberships(school_id,user_id) values ($1,$2)",[other,user]),{code:"42501"});
    }
  } finally { await db.close(); }
});
