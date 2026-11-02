import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { localStack, check } from "./local.mjs";
import { verifyStorage } from "./test-storage.mjs";

const { url, key, admin } = localStack();
const origin = "http://127.0.0.1:3000";
const mail = "http://127.0.0.1:54324/api/v1";
const school = randomUUID();
const email = "auth-" + school + "@example.test";
const password = randomUUID();
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const actor = client();
const cookies = new Map();
async function request(path, body) {
  const headers = { Origin: origin, Cookie: [...cookies].map(([k,v]) => k+"="+v).join("; ") };
  const res = await fetch(origin + path, { method: body ? "POST" : "GET", headers, body, redirect: "manual" });
  for (const cookie of res.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    cookies.set(pair.slice(0,pair.indexOf("=")), pair.slice(pair.indexOf("=")+1));
  }
  return res;
}
async function submit(path, fields) {
  const page = await request(path);
  assert.equal(page.status, 200);
  const html = await page.text();
  const form = new FormData();
  const action = html.match(/name="(\$ACTION_ID_[^"]+)"/);
  assert.ok(action, "Formulário Next.js esperado em " + path.split("?")[0]);
  form.set(action[1],"");
  for (const [k,v] of Object.entries(fields)) form.set(k,v);
  const res = await request(path, form);
  assert.equal(res.status,303);
  return new URL(res.headers.get("location"),origin).pathname + new URL(res.headers.get("location"),origin).search;
}
let id;
try {
  assert.ok([303,307].includes((await request("/painel")).status));
  assert.ok((await actor.auth.signUp({ email, password })).error, "cadastro fechado");
  id = check(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user.id;
  check(await admin.from("schools").insert({ id:school, name:"Escola " + school }));
  assert.equal(await submit("/",{email,password}),"/painel");
  assert.match(await (await request("/painel")).text(),/Vínculo pendente/);
  check(await admin.from("school_memberships").insert({ school_id:school, user_id:id }));
  assert.ok((await (await request("/painel")).text()).includes("Escola " + school));
  assert.equal(await submit("/painel",{}),"/");
  assert.ok([303,307].includes((await request("/painel")).status));
  assert.equal(await submit("/recuperar",{email}),"/recuperar?aviso=enviado");
  let token;
  for (let i=0; i<25 && !token; i++) {
    const inbox = await (await fetch(mail + "/search?query=" + encodeURIComponent("to:"+email))).json();
    const message = inbox.messages?.find(m => m.To.some(t => t.Address === email));
    if (message) {
      const content = await (await fetch(mail+"/message/"+message.ID)).json();
      token = content.HTML.match(/token_hash=([a-zA-Z0-9_-]+)/)?.[1];
    }
    if (!token) await wait(700);
  }
  assert.ok(token,"E-mail de recuperação esperado na caixa local");
  const replacement = randomUUID();
  assert.equal(await submit("/redefinir?token_hash="+token,{ token,password:replacement }),"/?aviso=atualizada");
  assert.equal(await submit("/",{email,password}),"/?aviso=acesso");
  assert.equal(await submit("/",{email,password:replacement}),"/painel");
  assert.equal(await submit("/redefinir?token_hash="+token,{token,password:randomUUID()}),"/recuperar?aviso=invalido");
  check(await actor.auth.signInWithPassword({email,password:replacement}));
  await verifyStorage(admin,actor,client(),school,id);
  console.log("Entrada, acesso sem vínculo, painel autorizado, saída e recuperação por e-mail verificados.");
} finally {
  if (id) {
    check(await admin.from("school_memberships").delete().eq("school_id",school));
    check(await admin.from("schools").delete().eq("id",school));
    check(await admin.auth.admin.deleteUser(id));
  }
}
