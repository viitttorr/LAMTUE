"use client";
import { useState } from "react";
import Link from "next/link";
import { fmtData } from "@/lib/util";

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  ligante: { label: "Ligante", cls: "badge-green" },
  candidato: { label: "Candidato", cls: "badge-amber" },
};

type Acesso = { acao: string; detalhes: string | null; criado_em: string; nome: string | null; role: string | null; user_id: number };

const OPCOES = [10, 20, 30, 50] as const;
const ALTURA_LINHA = 58;

/**
 * Log geral de ACESSOS de ligantes e candidatos, com quantidade selecionável e
 * rolagem própria. A atividade completa (páginas abertas e ações) fica no log
 * individual de cada conta, em /diretoria/logs/[id].
 */
export default function LogLigantesCandidatos({ acoes }: { acoes: Acesso[] }) {
  const [quantidade, setQuantidade] = useState<number>(10);
  const visiveis = acoes.slice(0, quantidade);

  return (
    <div className="card">
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 16 }}>Acessos — ligantes e candidatos</h3>
          <p className="small mt-1">Para ver páginas e ações de alguém, abra o LOG individual em Ligantes ou Seletivo.</p>
        </div>
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
        {visiveis.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nenhum acesso registrado.</p>}
        {visiveis.map((a, i) => {
          const role = a.role ? ROLE_LABEL[a.role] : null;
          return (
            <div key={i} style={{ padding: "9px 4px", borderBottom: i < visiveis.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13.5 }}>
              <div className="flex-between" style={{ gap: 10 }}>
                <span className="flex" style={{ gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{a.nome ?? "Sistema"}</strong>
                  {role && <span className={`badge ${role.cls}`} style={{ fontSize: 10.5 }}>{role.label}</span>}
                  <span>· entrou no portal</span>
                  <Link href={`/diretoria/logs/${a.user_id}`} className="small" style={{ color: "var(--blue)" }}>ver LOG</Link>
                </span>
                <span className="small" style={{ whiteSpace: "nowrap" }}>{fmtData(a.criado_em, true)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
