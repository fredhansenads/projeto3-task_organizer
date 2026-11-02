import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {writeFile,readFile,unlink,mkdir} from "node:fs/promises";
import { check } from "./local.mjs";

// Executado somente pelo teste local, na escola temporária criada por ele.
export async function verifyStorage(admin, actor, anonymous, school, user) {
  const version = randomUUID();
  const attachment = randomUUID();
  const path = [school,version,attachment].join("/");
  const payload = new TextEncoder().encode("%PDF-1.4 arquivo de teste");
  const insert = async (table, fields) => check(await admin.from(table).insert({school_id:school,...fields}).select("id").single()).id;
  const files = actor.storage.from("materiais");
  let uploaded = false;
  try {
    const year = await insert("academic_years",{year:2026});
    const teacher = await insert("teachers",{name:"Professor de teste"});
    const request = await insert("material_requests",{year_id:year,title:"Planos"});
    const obligation = await insert("delivery_obligations",{teacher_id:teacher,request_id:request});
    await insert("receipt_versions",{id:version,obligation_id:obligation,version:1,received_at:new Date().toISOString(),channel:"arquivo"});
    await insert("attachments",{id:attachment,version_id:version,file_name:"teste.pdf",object_path:path,mime_type:"application/pdf",byte_size:payload.length});
    const confirm=()=>actor.rpc("material_command",{sid:school,op:"confirm",token:randomUUID(),d:{id:attachment}});
    assert.ok((await confirm()).error,"não se pode confirmar uma reserva vazia");
    assert.ok((await files.upload(path,payload,{contentType:"text/plain"})).error);
    check(await files.upload(path,payload,{contentType:"application/pdf"}));
    uploaded = true;
    assert.ok((await files.download(path)).error,"upload incompleto não permite download");
    check(await confirm());
    assert.equal(await check(await files.download(path)).text(),new TextDecoder().decode(payload));
    // Ensaio de restauração restrito aos dois UUIDs recém-criados nesta escola de teste.
    const row=async(table,id)=>check(await actor.from(table).select("*").eq("school_id",school).eq("id",id).single());
    const snapshot={version:await row("receipt_versions",version),attachment:await row("attachments",attachment),
      bytes:Buffer.from(await check(await files.download(path)).arrayBuffer()).toString("base64")};
    await mkdir(".artifacts",{recursive:true});
    const copy=".artifacts/restore-"+randomUUID()+".json";
    await writeFile(copy,JSON.stringify(snapshot),{flag:"wx",mode:0o600});
    try {
      check(await admin.storage.from("materiais").remove([path]));
      check(await admin.from("attachments").delete().eq("school_id",school).eq("id",attachment));
      check(await admin.from("receipt_versions").delete().eq("school_id",school).eq("id",version));
      assert.ok((await files.download(path)).error);
      const restored=JSON.parse(await readFile(copy,"utf8"));
      check(await admin.from("receipt_versions").insert(restored.version));
      check(await admin.from("attachments").insert({...restored.attachment,ready:false}));
      check(await files.upload(path,Buffer.from(restored.bytes,"base64"),{contentType:restored.attachment.mime_type}));
      check(await confirm());
      assert.deepEqual(await row("receipt_versions",version),snapshot.version);
      assert.deepEqual(await row("attachments",attachment),snapshot.attachment);
      assert.deepEqual(Buffer.from(await check(await files.download(path)).arrayBuffer()),Buffer.from(payload));
    } finally {await unlink(copy);}
    console.log("Versão recebida, metadados e conteúdo do anexo restaurados da cópia local.");
    assert.ok((await anonymous.storage.from("materiais").download(path)).error);
    check(await admin.from("school_memberships").update({active:false}).eq("school_id",school).eq("user_id",user));
    assert.ok((await files.download(path)).error);
    console.log("Arquivo privado verificado com conta vinculada, vínculo inativo e sessão ausente.");
  } finally {
    if (uploaded) check(await admin.storage.from("materiais").remove([path]));
    for (const table of ["attachments","receipt_versions","delivery_obligations","material_requests","teachers","academic_years","audit_events"]) {
      check(await admin.from(table).delete().eq("school_id",school));
    }
  }
}
