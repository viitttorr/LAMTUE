import { getConfig } from "@/lib/db";
import { enviarEmail } from "@/lib/mailer";
import Reveal from "@/components/Reveal";
import PageHeader from "@/components/PageHeader";
import FormAcao from "@/components/FormAcao";

export const dynamic = "force-dynamic";

async function enviarContato(formData: FormData) {
  "use server";
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const mensagem = String(formData.get("mensagem") || "").trim();
  if (!nome || !email || !mensagem) return { erro: "Preencha todos os campos." };
  const destino = await getConfig("email_contato", "lamtue.uri@gmail.com");
  const contatoLinha = whatsapp ? `\nWhatsApp: ${whatsapp}` : "";
  await enviarEmail(destino, `Contato pelo portal — ${nome}`, `De: ${nome} <${email}>${contatoLinha}\n\n${mensagem}`, "contato");
  return { ok: "Mensagem enviada! A diretoria retornará em breve." };
}

export default async function ContatoPage() {
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
              <FormAcao action={enviarContato}>
                <label className="label">Seu nome</label>
                <input className="input" name="nome" required maxLength={120} />
                <label className="label">Seu e-mail</label>
                <input className="input" type="email" name="email" required maxLength={120} />
                <label className="label">Seu WhatsApp (opcional)</label>
                <input className="input" name="whatsapp" placeholder="(54) 9 9999-9999" maxLength={20} />
                <label className="label">Mensagem</label>
                <textarea className="input" name="mensagem" required maxLength={2000} rows={5} />
                <button className="btn btn-primary mt-3" type="submit">Enviar mensagem</button>
              </FormAcao>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
