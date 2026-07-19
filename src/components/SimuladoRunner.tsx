"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finalizarSimulado } from "@/app/actions/ligante";

type Q = { enunciado: string; alternativas: string[] };

export default function SimuladoRunner({ simuladoId, questoes }: { simuladoId: number; questoes: Q[] }) {
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const q = questoes[idx];
  const ultima = idx === questoes.length - 1;

  const avancar = () => {
    if (sel === null) return;
    const novas = [...respostas, sel];
    setRespostas(novas);
    setSel(null);
    if (ultima) {
      start(async () => {
        await finalizarSimulado(simuladoId, novas);
        router.refresh();
      });
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <div className="flex-between">
        <span className="badge badge-blue">Questão {idx + 1} de {questoes.length}</span>
        <div className="progress" style={{ width: 160 }}><span style={{ width: `${(idx / questoes.length) * 100}%` }} /></div>
      </div>
      <p className="mt-2" style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.6 }}>{q.enunciado}</p>
      <div className="mt-2" style={{ display: "grid", gap: 10 }}>
        {q.alternativas.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSel(i)}
            className="glass"
            style={{
              padding: "13px 16px", textAlign: "left", cursor: "pointer", fontSize: 14.5,
              color: "var(--text)", fontFamily: "inherit", lineHeight: 1.5,
              border: sel === i ? "1px solid var(--blue)" : "1px solid var(--border)",
              boxShadow: sel === i ? "0 0 0 3px rgba(56,189,248,0.15)" : "none",
              background: sel === i ? "rgba(14,165,233,0.12)" : undefined,
            }}
          >
            <strong style={{ color: sel === i ? "var(--blue)" : "var(--text-3)", marginRight: 10 }}>
              {String.fromCharCode(65 + i)}
            </strong>
            {a}
          </button>
        ))}
      </div>
      <button className="btn btn-primary mt-3" disabled={sel === null || pending} onClick={avancar}>
        {pending ? "Corrigindo…" : ultima ? "Finalizar simulado" : "Próxima questão →"}
      </button>
    </div>
  );
}
