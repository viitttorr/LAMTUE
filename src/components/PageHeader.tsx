import Reveal from "./Reveal";

/** Cabeçalho visual padrão das páginas internas do redesign. */
export default function PageHeader({
  eyebrow,
  titulo,
  children,
}: {
  eyebrow: string;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <Reveal>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="section-title">{titulo}</h1>
        {children}
      </Reveal>
    </header>
  );
}
