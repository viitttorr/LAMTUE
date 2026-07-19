import { exigirLigante } from "@/lib/auth";
import { trocarSenha } from "@/app/actions/auth";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function TrocarSenhaPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const s = await exigirLigante();
  const { erro } = await searchParams;
  return (
    <div className="container" style={{ padding: "70px 24px 20px", maxWidth: 480 }}>
      <Reveal>
        <div className="card">
          <h1 style={{ fontSize: 22 }}>Definir nova senha</h1>
          <p className="small mt-1">
            {s.mustChange
              ? "Por segurança, é obrigatório trocar a senha temporária no primeiro acesso."
              : "Escolha uma nova senha para sua conta."}
          </p>
          {erro && <div className="alert alert-red">{erro}</div>}
          <form action={trocarSenha}>
            <label className="label">Senha atual</label>
            <input className="input" type="password" name="atual" required autoComplete="current-password" />
            <label className="label">Nova senha (mín. 8 caracteres)</label>
            <input className="input" type="password" name="nova" required minLength={8} autoComplete="new-password" />
            <label className="label">Confirmar nova senha</label>
            <input className="input" type="password" name="confirma" required minLength={8} autoComplete="new-password" />
            <button className="btn btn-primary mt-3" style={{ width: "100%" }} type="submit">Salvar nova senha</button>
          </form>
        </div>
      </Reveal>
    </div>
  );
}
