import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function localStack() {
  // Read the local CLI status directly. Never inherit a hosted project URL or admin key.
  const cli = join("node_modules", "supabase", "dist", "supabase.js");
  const output = execFileSync(process.execPath, [cli, "status", "-o", "json"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const info = JSON.parse(output);
  if (new URL(info.API_URL).origin !== "http://127.0.0.1:54321") throw Error("Supabase local esperado na porta 54321.");
  const key = info.PUBLISHABLE_KEY || info.ANON_KEY;
  const secret = info.SECRET_KEY || info.SERVICE_ROLE_KEY;
  if (!key || !secret) throw Error("Chaves locais ausentes.");
  const admin = createClient(info.API_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return { url: info.API_URL, key, admin };
}

export function check(result) {
  if (result.error) throw Error(result.error.message);
  return result.data;
}

export async function setup() {
  const { url, key, admin } = localStack();
  const appEnv = "NEXT_PUBLIC_SUPABASE_URL=" + url + "\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" + key + "\nAPP_URL=http://127.0.0.1:3000\n";
  // Preserve any existing configuration and refuse to replace a different environment.
  try { writeFileSync(".env.local", appEnv, { flag: "wx", mode: 0o600 }); }
  catch (e) { if (e.code !== "EEXIST" || readFileSync(".env.local","utf8") !== appEnv) throw e; }
  const accountFile = join(".env.demo.local");
  let fixture;
  try { fixture = JSON.parse(readFileSync(accountFile, "utf8")); }
  catch (e) {
    if (e.code !== "ENOENT") throw e;
    fixture = { email: "coordenacao@example.test", password: randomBytes(20).toString("base64url") };
    writeFileSync(accountFile, JSON.stringify(fixture), { flag: "wx", mode: 0o600 });
  }
  let user;
  if (fixture.userId) {
    const existing = await admin.auth.admin.getUserById(fixture.userId);
    if (existing.error && existing.error.status !== 404) throw existing.error;
    user = existing.data.user;
    if (user && user.email !== fixture.email) throw Error("O e-mail da conta local mudou. Confira o arquivo de demonstração.");
  }
  if (!user) {
    const credentials = { email: fixture.email, password: fixture.password };
    const localUser = createClient(url, key, { auth: { persistSession: false } });
    user = (await localUser.auth.signInWithPassword(credentials)).data.user;
    if (!user) user = check(await admin.auth.admin.createUser({ ...credentials, email_confirm: true })).user;
    fixture.userId = user.id;
    writeFileSync(accountFile, JSON.stringify(fixture), { mode: 0o600 });
  }
  const school = "10000000-0000-4000-8000-000000000001";
  check(await admin.from("schools").upsert({ id: school, name: "Escola de demonstração" }));
  check(await admin.from("profiles").upsert({ id: user.id, display_name: "Coordenação" }));
  check(await admin.from("school_memberships").upsert({ school_id: school, user_id: user.id }));
  console.log("Escola local preparada. A conta fictícia está em .env.demo.local.");
}
