import Link from "next/link";
import { recover } from "../actions";
const messages: Record<string,string> = {
  enviado: "Se houver uma conta com esse e-mail, você receberá um link de recuperação.",
  falha: "O serviço de e-mail está indisponível. Tente novamente.",
  invalido: "Link inválido ou expirado. Solicite outro.",
  senha: "Não foi possível atualizar a senha. Solicite outro link e escolha uma nova senha.",
};
export default async function Page({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  return <section><h1>Recuperar acesso</h1><p>Informe seu e-mail para receber as instruções.</p>
    {aviso && messages[aviso] && <p role="status">{messages[aviso]}</p>}
    <form action={recover}><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><button>Solicitar link</button></form><Link href="/">Voltar para a entrada</Link></section>;
}
