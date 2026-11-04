import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { mkdir, rename, readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { localStack, check } from "./local.mjs";
import { root, withLock } from "./notebook-common.mjs";
import { createBackup, checkedBackup, verifyBackup, restoreEmpty } from "./notebook-backup.mjs";

process.chdir(root);
const { url, key, admin } = localStack();
const school = randomUUID();
const password = randomUUID();
const email = `backup-${school}@example.test`;
let user, objectPath, folder;
const bytes = Buffer.from("%PDF-1.4\nBackup de teste: conteúdo preservado.\n%%EOF\n");
await withLock(async () => {
  try {
    user = check(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user;
    check(await admin.from("schools").insert({ id: school, name: "Ensaio temporário de backup" }));
    check(await admin.from("school_memberships").insert({ school_id: school, user_id: user.id }));
    const insert = async (table, row) => check(await admin.from(table).insert({ school_id: school, ...row }).select("id").single()).id;
    const year = await insert("academic_years", { year: 2026 });
    const teacher = await insert("teachers", { name: "Professor de ensaio" });
    const request = await insert("material_requests", { year_id: year, title: "Material para ensaio" });
    const obligation = await insert("delivery_obligations", { teacher_id: teacher, request_id: request });
    const version = await insert("receipt_versions", { obligation_id: obligation, version: 1, received_at: new Date().toISOString(), channel: "arquivo" });
    const attachment = randomUUID();
    objectPath = [school, version, attachment].join("/");
    await insert("attachments", { id: attachment, version_id: version, file_name: "ensaio.pdf", object_path: objectPath, mime_type: "application/pdf", byte_size: bytes.length });
    const actor = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    check(await actor.auth.signInWithPassword({ email, password }));
    check(await actor.storage.from("materiais").upload(objectPath, bytes, { contentType: "application/pdf" }));
    check(await actor.rpc("material_command", { sid: school, op: "confirm", token: randomUUID(), d: { id: attachment } }));
    folder = await createBackup();
    await verifyBackup(folder);
    assert.deepEqual(Buffer.from(await check(await actor.storage.from("materiais").download(objectPath)).arrayBuffer()), bytes);
    const appEnv = join(folder, "app.env");
    const original = await readFile(appEnv);
    await writeFile(appEnv, "alterado para testar integridade");
    await assert.rejects(checkedBackup(folder), /corrompida ou alterada/);
    await writeFile(appEnv, original);
    await assert.rejects(restoreEmpty(folder), /Já existem dados locais/);
    console.log("A cópia alterada e a restauração sobre dados existentes foram rejeitadas; o anexo original permanece disponível.");
  } finally {
    if (objectPath) check(await admin.storage.from("materiais").remove([objectPath]));
    for (const table of ["attachments", "receipt_versions", "delivery_obligations", "material_requests", "teachers", "academic_years", "audit_events", "school_memberships"])
      check(await admin.from(table).delete().eq("school_id", school));
    check(await admin.from("schools").delete().eq("id", school));
    if (user) check(await admin.auth.admin.deleteUser(user.id));
    if (folder) {
      await mkdir(join(root, ".artifacts"), { recursive: true });
      await rename(folder, join(root, ".artifacts", `backup-ensaio-${basename(folder)}`));
    }
  }
});
