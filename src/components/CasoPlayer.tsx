"use client";
import { useState } from "react";
import Link from "next/link";
import { registrarCaso } from "@/app/actions/ligante";

type Opcao = { texto: string; correta: boolean; feedback: string };
type Etapa = { pergunta: string; opcoes: Opcao[] };

export default function CasoPlayer({ casoId, contexto, etapas }: { casoId: number; contexto: string; etapas: Etapa[] }) {
  const [idx, setIdx] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  const etapa = etapas[idx];

  const escolher = (i: number) => {
    if (escolha !== null) return;
    setEscolha(i);
    if (etapa.opcoes[i].correta) setAcertos((a) => a + 1);
  };

  const proximo = () => {
    if (idx === etapas.length - 1) {
      const total = etapas.length;
      const finalAcertos = acertos;
      setFim(true);
      registrarCaso(casoId, finalAcertos, total).catch(() => {});
    } else {
      setIdx(idx + 1);
      setEscolha(null);
    }
  };

  if (fim) {
    const pct = Math.round((acertos / etapas.length) * 100);
    return (
      <div className="card" style={{ maxWidth: 760, textAlign: "center" }}>
        <div className="stat-num" style={{ fontSize: 44, color: pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red-bright)" }}>{pct}%</div>
        <p className="muted">Você tomou a conduta correta em {acertos} de {etapas.length} decisões.</p>
        <div className="flex mt-3" style={{ justifyContent: "center" }}>
          <Link href="/ligante/casos" className="btn btn-primary">Outros casos</Link>
          <Link href="/ligante/simulados" className="btn">Fazer um simulado</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {idx === 0 && escolha === null && (
        <div className="card mb-2" style={{ borderColor: "rgba(56,189,248,0.3)" }}>
          <div className="eyebrow" style={{ fontSize: 11 }}>Cenário</div>
          <p className="mt-1" style={{ whiteSpace: "pre-line", fontSize: 14.5 }}>{contexto}</p>
        </div>
      )}
      <div className="card">
        <div className="flex-between">
          <span className="badge badge-blue">Decisão {idx + 1} de {etapas.length}</span>
          <div className="progress" style={{ width: 150 }}><span style={{ width: `${(idx / etapas.length) * 100}%` }} /></div>
        </div>
        <p className="mt-2" style={{ fontWeight: 600, fontSize: 15.5 }}>{etapa.pergunta}</p>
        <div className="mt-2" style={{ display: "grid", gap: 10 }}>
          {etapa.opcoes.map((o, i) => {
            const revelada = escolha !== null;
            const cor = revelada && o.correta ? "rgba(52,211,153,0.55)" : revelada && i === escolha ? "rgba(226,83,111,0.55)" : "var(--border)";
            return (
              <button
                key={i}
                type="button"
                onClick={() => escolher(i)}
                className="glass"
                style={{
                  padding: "13px 16px", textAlign: "left", fontSize: 14.5, lineHeight: 1.5,
                  cursor: revelada ? "default" : "pointer", color: "var(--text)", fontFamily: "inherit",
                  border: `1px solid ${cor}`,
                  background: revelada && o.correta ? "rgba(52,211,153,0.07)" : revelada && i === escolha ? "rgba(139,21,56,0.1)" : undefined,
                }}
              >
                <strong style={{ marginRight: 10, color: "var(--text-3)" }}>{String.fromCharCode(65 + i)}</strong>
                {o.texto}
              </button>
            );
          })}
        </div>
        {escolha !== null && (
          <>
            <div className={`alert ${etapa.opcoes[escolha].correta ? "alert-green" : "alert-red"} mt-2`} style={{ marginBottom: 0 }}>
              <strong>{etapa.opcoes[escolha].correta ? "Conduta correta." : "Conduta inadequada."}</strong>{" "}
              {etapa.opcoes[escolha].feedback}
            </div>
            <button className="btn btn-primary mt-3" onClick={proximo}>
              {idx === etapas.length - 1 ? "Encerrar atendimento" : "Próxima decisão →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
