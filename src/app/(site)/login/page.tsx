import Image from "next/image";
import { login } from "@/app/actions/auth";
import Reveal from "@/components/Reveal";
import ECGLine from "@/components/ECGLine";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="container" style={{ padding: "70px 24px 20px", maxWidth: 480 }}>
      <Reveal>
        <div className="card" style={{ textAlign: "center" }}>
          <Image src="/logo.png" alt="LAMTUE" width={72} height={72} className="logo-ring" style={{ borderRadius: "50%", margin: "0 auto 14px" }} />
          <h1 style={{ fontSize: 23 }}>Acesso restrito</h1>
          <p className="small mt-1">Área do Ligante e da Diretoria</p>
          {erro && <div className="alert alert-red" style={{ textAlign: "left" }}>{erro}</div>}
          <form action={login} style={{ textAlign: "left" }}>
            <label className="label">E-mail ou matrícula</label>
            <input className="input" name="identificador" required autoComplete="username" />
            <label className="label">Senha</label>
            <input className="input" type="password" name="senha" required autoComplete="current-password" />
            <button className="btn btn-primary mt-3" style={{ width: "100%" }} type="submit">Entrar</button>
          </form>
          <p className="small mt-3">
            Primeiro acesso de ligante: use sua <strong>matrícula</strong> como login e senha.
            O sistema pedirá a troca de senha em seguida.
          </p>
        </div>
        <div className="mt-3"><ECGLine height={44} /></div>
      </Reveal>
    </div>
  );
}
