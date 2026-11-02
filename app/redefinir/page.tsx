import { redirect } from "next/navigation";
import { reset } from "../actions";
export default async function Page({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash } = await searchParams;
  if (!token_hash) redirect("/recuperar?aviso=invalido");
  return <section><h1>Escolher nova senha</h1><p>Use pelo menos 10 caracteres.</p>
    <form action={reset}><input type="hidden" name="token" value={token_hash} /><label>Nova senha<input type="password" name="password" autoComplete="new-password" minLength={10} required /></label>
    <button>Salvar senha</button></form></section>;
}
