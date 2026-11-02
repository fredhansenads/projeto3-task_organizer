import "./styles.css";
export const metadata = { title: "Minha Rotina Escolar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><header><span aria-hidden="true" className="brand">M</span> Minha Rotina Escolar</header><main>{children}</main></body></html>;
}
