import { redirect } from "next/navigation";
import { authClient } from "../../lib/supabase";
import { logout } from "../actions";
export default async function Page() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const client = await authClient(true);
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/");
  const { data, error } = await client.from("schools").select("name").order("name");
  if (error) throw new Error("Não foi possível consultar as escolas.");
  return <section><small>MINHA ESCOLA</small><h1>{data.length ? "Área da coordenação" : "Vínculo pendente"}</h1>
    {data.length ? <><p>Escolas disponíveis para sua conta</p><ul>{data.map(row => <li key={row.name}>{row.name}</li>)}</ul></> :
    <p>Peça à administração para vincular sua conta a uma escola.</p>}
    <p>{user.email}</p><form action={logout}><button>Sair</button></form></section>;
}
