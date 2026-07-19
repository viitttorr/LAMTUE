import { db } from "./db";

export function registrarAcao(userId: number | null, acao: string, detalhes?: string) {
  db().prepare("INSERT INTO audit_log (user_id, acao, detalhes) VALUES (?, ?, ?)").run(userId, acao, detalhes ?? null);
}
