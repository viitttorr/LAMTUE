import { getConfig } from "@/lib/db";
import { enviarEmail } from "@/lib/mailer";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function enviarContato(formData: FormData) {
  "use server";
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const mensagem = String(formData.get("mensagem") || "").trim();
  if (!nome || !email || !mensagem) redirect("/contato?erro=1");
  const destino = await getConfig("email_contato", "lamtue.uri@gmail.com");
  const contatoLinha = whatsapp ? `\nWhatsApp: ${whatsapp}` : "";
  await enviarEmail(destino, `Contato pelo portal — ${nome}`, `De: ${nome} <${email}>${contatoLinha}\n\n${mensagem}`, "contato");
  redirect("/contato?ok=1");
}

export default async function ContatoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  const emailContato = await getConfig("email_contato", "lamtue.uri@gmail.com");
  return (
    <div className="container" style={{ padding: "60px 24px 20px" }}>
      <div className="page-panel">
        <PageHeader eyebrow="Fale com a liga" titulo="Contato" />
        <div className="grid2 mt-2" style={{ alignItems: "start" }}>
          <Reveal>
            <div className="card">
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Canais oficiais</h3>
              <div style={{ display: "grid", gap: 12, fontSize: 14.5 }}>
                <div><div className="small">Universidade</div>URI — Campus Erechim/RS · Curso de Medicina</div>
                <div><div className="small">Vínculo</div>CAMED — Centro Acadêmico de Medicina</div>
                <div><div className="small">E-mail</div>{emailContato}</div>
                <div><div className="small">Instagram</div>@lamtue.uri</div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="card">
              <h3 style={{ fontSize: 18 }}>Envie uma mensagem</h3>
              {ok && <div className="alert alert-green">Mensagem enviada! A diretoria retornará em breve.</div>}
              {erro && <div className="alert alert-red">Preencha todos os campos.</div>}
              <form action={enviarContato}>
                <label className="label">Seu nome</label>
                <input className="input" name="nome" required maxLength={120} />
                <label className="label">Seu e-mail</label>
                <input className="input" type="email" name="email" required maxLength={120} />
                <label className="label">Seu WhatsApp (opcional)</label>
                <input className="input" name="whatsapp" placeholder="(54) 9 9999-9999" maxLength={20} />
                <label className="label">Mensagem</label>
                <textarea className="input" name="mensagem" required maxLength={2000} rows={5} />
                <button className="btn btn-primary mt-3" type="submit">Enviar mensagem</button>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
