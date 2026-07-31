import { criarTicket } from "@/app/actions/tickets";
import FormAcao from "@/components/FormAcao";

/** Formulário de abertura de ticket — usado nas áreas de ligante e candidato. */
export default function NovoTicketForm({ assuntoPadrao }: { assuntoPadrao?: string }) {
  return (
    <>
      <h1 className="page-title">Novo ticket</h1>
      <p className="page-sub">Sua mensagem chega para a diretoria, que responde por aqui.</p>
      <div className="card" style={{ maxWidth: 560 }}>
        <FormAcao action={criarTicket}>
          <label className="label">Assunto *</label>
          <input className="input" name="assunto" required maxLength={120} defaultValue={assuntoPadrao ?? ""} />
          <label className="label">Mensagem *</label>
          <textarea className="input" name="mensagem" rows={6} required />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Enviar</button>
        </FormAcao>
      </div>
    </>
  );
}
