"use client";
import { useState } from "react";

const OUTROS = "__outros__";

/**
 * Select de tema com opção "Outros": ao escolher, troca para um campo de
 * texto livre. Só um elemento leva `name` por vez, então o FormData nunca
 * recebe a palavra "Outros" — sempre o texto fixo escolhido ou o digitado.
 */
export default function TemaSelect({
  name,
  temas,
  defaultValue = "",
  required = false,
  allowBlank = false,
}: {
  name: string;
  temas: readonly string[];
  defaultValue?: string;
  required?: boolean;
  allowBlank?: boolean;
}) {
  const eraFixo = defaultValue === "" || (temas as readonly string[]).includes(defaultValue);
  const [outros, setOutros] = useState(!eraFixo);

  if (outros) {
    return (
      <div>
        <input
          className="input"
          name={name}
          required={required}
          defaultValue={eraFixo ? "" : defaultValue}
          placeholder="Digite o tema"
          autoFocus
        />
        <button
          type="button"
          className="small mt-1"
          style={{ color: "var(--blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => setOutros(false)}
        >
          ← escolher da lista
        </button>
      </div>
    );
  }

  return (
    <select
      className="input"
      name={name}
      required={required}
      defaultValue={defaultValue}
      onChange={(e) => {
        if (e.target.value === OUTROS) setOutros(true);
      }}
    >
      {allowBlank && <option value="">— livre —</option>}
      {!allowBlank && <option value="" disabled>Selecione</option>}
      {temas.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
      <option value={OUTROS}>Outros</option>
    </select>
  );
}
