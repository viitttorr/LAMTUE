import { db, getConfig, setConfig } from "./db";
import { notificarLigantes } from "./notify";

/**
 * Agendador interno: verifica a cada 30 minutos se há aula nas próximas 24h
 * e dispara o lembrete automático (uma única vez por aula).
 */
export function iniciarAgendador() {
  const g = globalThis as unknown as { __lamtueScheduler?: boolean };
  if (g.__lamtueScheduler) return;
  g.__lamtueScheduler = true;

  const verificar = async () => {
    try {
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const aulas = db().prepare("SELECT id, titulo, data, local FROM aulas WHERE data = ?").all(amanha) as
        { id: number; titulo: string; data: string; local: string | null }[];
      for (const aula of aulas) {
        const chave = `lembrete_enviado_${aula.id}`;
        if (getConfig(chave)) continue;
        setConfig(chave, new Date().toISOString());
        await notificarLigantes(
          "todos",
          "Lembrete de aula — LAMTUE",
          `Amanhã tem LAMTUE! 🚑\n\nAula: ${aula.titulo}\nData: ${new Date(aula.data + "T12:00").toLocaleDateString("pt-BR")}${aula.local ? `\nLocal: ${aula.local}` : ""}\n\nSua presença conta para a certificação.`,
          "lembrete_aula_automatico"
        );
      }
    } catch (e) {
      console.error("Agendador de lembretes:", e);
    }
  };

  setTimeout(verificar, 15_000);
  setInterval(verificar, 30 * 60 * 1000);
}
