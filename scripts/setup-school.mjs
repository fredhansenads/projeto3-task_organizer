import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { localStack, check } from "./local.mjs";
import { root, dbName, run, withLock } from "./notebook-common.mjs";

process.chdir(root);
const name = process.argv[2]?.trim();
if (!name || name.length > 160) throw Error("Informe o nome da escola (até 160 caracteres).");

await withLock(async () => {
  const { admin } = localStack(); // Explicitly refuses a hosted Supabase project.
  const account = JSON.parse(await readFile(".env.demo.local", "utf8"));
  const user = check(await admin.auth.admin.getUserById(account.userId)).user;
  if (user.email !== account.email) throw Error("A conta local mudou. Confira o vínculo antes de cadastrar a escola.");
  const matches = check(await admin.from("schools").select("id").eq("name", name));
  if (matches.length > 1) throw Error("Há mais de uma escola com esse nome. Confira os cadastros existentes.");
  const id = matches[0]?.id || randomUUID();
  if (matches.length) {
    const membership = check(await admin.from("school_memberships").select("active")
      .eq("school_id", id).eq("user_id", user.id).maybeSingle());
    if (!membership?.active) throw Error("Essa escola já existe e não está vinculada à conta local. Nenhuma alteração realizada.");
  }
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date());
  // psql variables quote values as SQL literals. The three records are committed together.
  await run("docker", ["exec", "-i", dbName, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
    "-U", "postgres", "-d", "postgres", "-v", `school_id=${id}`, "-v", `school_name=${name}`,
    "-v", `user_id=${user.id}`, "-v", `year=${year}`], { input: `
BEGIN;
INSERT INTO public.schools (id, name) VALUES (:'school_id'::uuid, :'school_name') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.school_memberships (school_id, user_id) VALUES (:'school_id'::uuid, :'user_id'::uuid) ON CONFLICT DO NOTHING;
INSERT INTO public.academic_years (school_id, year) VALUES (:'school_id'::uuid, :'year'::integer) ON CONFLICT (school_id, year) DO NOTHING;
COMMIT;
` });
  console.log(`${name} vinculada à conta local. Ano letivo: ${year}.`);
  console.log(`http://127.0.0.1:3000/painel?escola=${id}`);
});
