"use client";
import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { fmtData } from "@/lib/util";
import FormAcao from "@/components/FormAcao";
import {
  alterarStatusInscricao,
  reenviarConfirmacao,
  salvarAcertosEmMassa,
  criarContaCandidato,
  excluirInscricao,
} from "@/app/actions/diretoria";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  espera: "Lista de espera",
};

type Inscrito = {
  id: number; nome: string; matricula: string; semestre: string; email: string; telefone: string;
  comprovante_id: number | null; status: string; criado_em: string; user_id: number | null; turma: string | null;
  acertos: number;
};

/**
 * Filtro client-side por nome/matrícula: evita navegação de página (e o
 * salto de scroll que ela causa) e atualiza só a área da tabela, usando
 * useDeferredValue para um efeito de loading local enquanto refiltra.
 */
export default function InscritosTable({ inscritos }: { inscritos: Inscrito[] }) {
  const [busca, setBusca] = useState("");
  const buscaDeferida = useDeferredValue(busca);
  const carregando = busca !== buscaDeferida;

  const termo = buscaDeferida.trim().toLowerCase();
  const filtrados = termo
    ? inscritos.filter((i) => i.nome.toLowerCase().includes(termo) || i.matricula.toLowerCase().includes(termo))
    : inscritos;

  return (
    <div>
      <div className="flex-between" style={{ margin: "10px 0 12px", flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontSize: 17 }}>
          Inscritos em tempo real {termo && <span className="small muted">({filtrados.length} de {inscritos.length})</span>}
        </h3>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          <input
            className="input"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou matrícula…"
            style={{ padding: "7px 12px", fontSize: 13.5, width: 240 }}
          />
          {busca && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setBusca("")}>Limpar</button>
          )}
        </div>
      </div>
      <p className="small muted mb-1">
        Preencha o gabarito de quantos candidatos quiser e clique em "Atualizar gabarito de todos" para salvar tudo de uma vez.
      </p>
      <FormAcao id="lote-gabarito" action={salvarAcertosEmMassa} />
      <div className="flex-between mb-1" style={{ flexWrap: "wrap", gap: 10 }}>
        <span />
        <button type="submit" form="lote-gabarito" className="btn btn-sm btn-blue">Atualizar gabarito de todos</button>
      </div>
      <div className="table-wrap" style={{ opacity: carregando ? 0.5 : 1, transition: "opacity 0.15s", position: "relative" }}>
        {carregando && (
          <div className="small muted" style={{ position: "absolute", top: -22, right: 0 }}>Filtrando…</div>
        )}
        <table className="tbl">
          <thead><tr><th>Candidato</th><th>Matrícula</th><th>Sem.</th><th>Contato</th><th>Comprovante</th><th>Inscrição</th><th>Status</th><th>Gabarito (21)</th><th>Conta</th><th></th></tr></thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={10} className="muted">{termo ? "Nenhum inscrito encontrado." : "Nenhuma inscrição recebida."}</td></tr>}
            {filtrados.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.nome}</strong></td>
                <td className="muted">{i.matricula}</td>
                <td className="muted">{i.turma ? `${i.turma} · ${i.semestre}` : i.semestre}</td>
                <td className="muted" style={{ fontSize: 13 }}>{i.email}<br />{i.telefone}</td>
                <td>
                  {i.comprovante_id
                    ? <a className="btn btn-sm" href={`/api/arquivos/${i.comprovante_id}`} target="_blank">Ver</a>
                    : <span className="muted">—</span>}
                </td>
                <td className="muted" style={{ fontSize: 13 }}>{fmtData(i.criado_em, true)}</td>
                <td>
                  <div className="flex" style={{ gap: 6 }}>
                    <FormAcao action={alterarStatusInscricao} className="flex" style={{ gap: 6 }}>
                      <input type="hidden" name="id" value={i.id} />
                      <select className="input" name="status" defaultValue={i.status} style={{ padding: "6px 10px", fontSize: 13, width: "auto" }}>
                        {Object.entries(STATUS_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                      <button className="btn btn-sm" type="submit">OK</button>
                    </FormAcao>
                    <FormAcao action={reenviarConfirmacao}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-ghost" type="submit" title="Reenviar e-mail de confirmação">✉</button>
                    </FormAcao>
                  </div>
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    name={`acertos_${i.id}`}
                    form="lote-gabarito"
                    min={0}
                    max={21}
                    defaultValue={i.acertos}
                    style={{ width: 70, padding: "6px 8px", fontSize: 13 }}
                  />
                </td>
                <td>
                  {i.user_id ? (
                    <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
                      <span className="badge badge-green">Conta criada</span>
                      <Link href={`/diretoria/logs/${i.user_id}`} className="btn btn-sm" title="Ver atividade deste candidato">Ver LOG</Link>
                    </div>
                  ) : (
                    <FormAcao action={criarContaCandidato}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-blue" type="submit" title="Cria login limitado para o candidato acompanhar o status">Criar conta</button>
                    </FormAcao>
                  )}
                </td>
                <td>
                  <FormAcao action={excluirInscricao}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn btn-sm btn-danger" type="submit" title="Excluir inscrição">Excluir</button>
                  </FormAcao>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
