import Link from "next/link";
import { login } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return <section><small>ÁREA DA COORDENAÇÃO</small><h1>Entrar na escola</h1>
    <p>Use o e-mail cadastrado pela coordenação.</p>
    {aviso === "acesso" && <p role="status">Não foi possível entrar. Confira seus dados e tente novamente.</p>}
    {aviso === "atualizada" && <p role="status">Senha atualizada. Entre com sua nova senha.</p>}
    {configured ? <><form action={login}><label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
    <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
    <button>Entrar</button></form><Link href="/recuperar">Esqueci minha senha</Link></> : <p role="status">A configuração do acesso à escola está pendente.</p>}</section>;
}
