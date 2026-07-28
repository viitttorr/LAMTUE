"use client";
import { useState } from "react";
import { CARGOS_DIRETORIA } from "@/lib/cargos";

/**
 * Escolha de papel (Ligante/Diretoria) no cadastro de conta. Ligante mostra
 * o campo Turma; Diretoria revela um select de cargo com opções fechadas —
 * as permissões (podeVerFinanceiro, podeGerenciarGaleria etc.) casam
 * substrings nesses textos, então manter a lista fechada evita cargos
 * digitados livremente que não batam com nenhuma permissão.
 */
export default function RoleCargoFields({
  defaultRole = "ligante",
  defaultTurma = "",
  defaultCargo = "",
}: {
  defaultRole?: "ligante" | "diretoria";
  defaultTurma?: string;
  defaultCargo?: string;
}) {
  const [role, setRole] = useState<"ligante" | "diretoria">(defaultRole);

  return (
    <>
      <div className="grid2" style={{ gap: 12 }}>
        <div>
          <label className="label">Papel *</label>
          <select className="input" name="role" value={role} onChange={(e) => setRole(e.target.value as "ligante" | "diretoria")}>
            <option value="ligante">Ligante</option>
            <option value="diretoria">Diretoria</option>
          </select>
        </div>
        {role === "ligante" ? (
          <div><label className="label">Turma</label><input className="input" name="turma" placeholder="T7" defaultValue={defaultTurma} /></div>
        ) : (
          <div>
            <label className="label">Cargo *</label>
            <select className="input" name="cargo" required defaultValue={defaultCargo}>
              <option value="" disabled>Selecione</option>
              {CARGOS_DIRETORIA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
    </>
  );
}
