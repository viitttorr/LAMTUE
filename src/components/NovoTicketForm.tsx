import { criarTicket } from "@/app/actions/tickets";

/** Formulário de abertura de ticket — usado nas áreas de ligante e candidato. */
export default function NovoTicketForm({ erro, assuntoPadrao }: { erro?: string; assuntoPadrao?: string }) {
  return (
    <>
      <h1 className="page-title">Novo ticket</h1>
      <p className="page-sub">Sua mensagem chega para a diretoria, que responde por aqui.</p>
      {erro && <div className="alert alert-red">{erro}</div>}
      <div className="card" style={{ maxWidth: 560 }}>
        <form action={criarTicket}>
          <label className="label">Assunto *</label>
          <input className="input" name="assunto" required maxLength={120} defaultValue={assuntoPadrao ?? ""} />
          <label className="label">Mensagem *</label>
          <textarea className="input" name="mensagem" rows={6} required />
          <button className="btn btn-primary btn-sm mt-2" type="submit">Enviar</button>
        </form>
      </div>
    </>
  );
}
