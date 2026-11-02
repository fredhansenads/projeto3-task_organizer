import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
    assert.ok((await files.upload(path,payload,{contentType:"text/plain"})).error);
    check(await files.upload(path,payload,{contentType:"application/pdf"}));
    uploaded = true;
    assert.equal(await check(await files.download(path)).text(),new TextDecoder().decode(payload));
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
