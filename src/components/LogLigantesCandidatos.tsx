"use client";
import { useState } from "react";
import { fmtData } from "@/lib/util";

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  ligante: { label: "Ligante", cls: "badge-green" },
  candidato: { label: "Candidato", cls: "badge-amber" },
};

type Acao = { acao: string; detalhes: string | null; criado_em: string; nome: string | null; role: string | null };

const OPCOES = [10, 20, 30, 50] as const;
const ALTURA_LINHA = 58;

/** Log de ligantes/candidatos com quantidade selecionável e rolagem própria, sem afetar o scroll da página. */
export default function LogLigantesCandidatos({ acoes }: { acoes: Acao[] }) {
  const [quantidade, setQuantidade] = useState<number>(10);
  const visiveis = acoes.slice(0, quantidade);

  return (
    <div className="card">
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontSize: 16 }}>Log de ações — ligantes e candidatos</h3>
        <label className="flex" style={{ gap: 6, alignItems: "center", fontSize: 13 }}>
          Mostrar
          <select
            className="input"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            style={{ padding: "5px 8px", fontSize: 13, width: "auto" }}
          >
            {OPCOES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-1" style={{ maxHeight: ALTURA_LINHA * 10, overflowY: "auto" }}>
        {visiveis.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nenhuma ação registrada.</p>}
        {visiveis.map((a, i) => {
          const role = a.role ? ROLE_LABEL[a.role] : null;
          return (
            <div key={i} style={{ padding: "9px 4px", borderBottom: i < visiveis.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13.5 }}>
              <div className="flex-between">
                <span className="flex" style={{ gap: 6, alignItems: "center" }}>
                  <strong>{a.nome ?? "Sistema"}</strong>
                  {role && <span className={`badge ${role.cls}`} style={{ fontSize: 10.5 }}>{role.label}</span>}
                  <span>· {a.acao.replace(/_/g, " ")}</span>
                </span>
                <span className="small">{fmtData(a.criado_em, true)}</span>
              </div>
              {a.detalhes && <div className="small">{a.detalhes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
