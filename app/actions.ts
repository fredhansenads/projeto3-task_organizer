"use server";

import { redirect } from "next/navigation";
import { authClient } from "../lib/supabase";

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export async function login(data: FormData) {
  const client = await authClient();
  const { error } = await client.auth.signInWithPassword({
    email: field(data, "email").trim(), password: field(data, "password"),
  });
  redirect(error ? "/?aviso=acesso" : "/painel");
}

export async function logout() {
  const client = await authClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Falha ao sair. Tente novamente.");
  redirect("/");
}

export async function recover(data: FormData) {
  const client = await authClient();
  const { error } = await client.auth.resetPasswordForEmail(field(data, "email").trim(), {
    redirectTo: new URL("/redefinir", process.env.APP_URL).href,
  });
  redirect(error && (!error.status || error.status >= 500) ? "/recuperar?aviso=falha" : "/recuperar?aviso=enviado");
}

export async function reset(data: FormData) {
  const password = field(data, "password");
  const token = field(data, "token");
  if (!token || password.length < 10) redirect("/recuperar?aviso=invalido");
  const client = await authClient();
  const verified = await client.auth.verifyOtp({ type: "recovery", token_hash: token });
  if (verified.error) redirect("/recuperar?aviso=invalido");
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect("/recuperar?aviso=senha");
  await client.auth.signOut({ scope: "local" });
  redirect("/?aviso=atualizada");
}
