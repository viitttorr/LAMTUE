/** Placeholder para as áreas do ligante que o candidato ainda não pode acessar. */
export default function BloqueadoSeletivo() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 34 }}>🔒</div>
        <h2 style={{ fontSize: 18, marginTop: 12 }}>Funcionalidade bloqueada</h2>
        <p className="muted mt-2" style={{ fontSize: 14.5 }}>
          Esta área é exclusiva para ligantes. Ela será liberada assim que sua inscrição for aprovada
          no processo seletivo e sua conta de ligante for criada pela diretoria.
        </p>
      </div>
    </div>
  );
}
