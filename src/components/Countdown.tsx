"use client";
import { useEffect, useState } from "react";

/** Contagem regressiva ao vivo para o prazo do seletivo. */
export default function Countdown({ prazo }: { prazo: string }) {
  const [restante, setRestante] = useState<string | null>(null);
  useEffect(() => {
    const alvo = new Date(prazo.includes("T") ? prazo : prazo + "T23:59:59").getTime();
    const tick = () => {
      const diff = alvo - Date.now();
      if (diff <= 0) { setRestante("Inscrições encerradas"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRestante(`${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prazo]);
  return (
    <span style={{ font: "700 22px var(--font-display)", color: "var(--red-bright)", fontVariantNumeric: "tabular-nums" }}>
      {restante ?? "…"}
    </span>
  );
}
