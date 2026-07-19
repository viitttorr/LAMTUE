/** Anéis de pulso tipo "sinal vital" (lub-dub) — camada decorativa do hero, sem JS. */
export default function HeartbeatPulse() {
  return (
    <div className="heartbeat-pulse" aria-hidden>
      <span className="ring" />
      <span className="ring d2" />
      <span className="ring d3" />
    </div>
  );
}
