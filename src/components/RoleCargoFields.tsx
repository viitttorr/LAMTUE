"use client";
import { useState } from "react";

/**
 * Escolha de papel (Ligante/Diretoria) no cadastro de conta. Ligante mostra
 * o campo Turma; Diretoria revela um campo de cargo livre — as permissões
 * (podeVerFinanceiro, podeGerenciarGaleria etc.) já casam substrings nesse
 * texto, então não há lista fixa de cargos aqui de propósito.
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
          <div><label className="label">Cargo *</label><input className="input" name="cargo" placeholder="Presidente, Diretora de…" required defaultValue={defaultCargo} /></div>
        )}
      </div>
    </>
  );
}
