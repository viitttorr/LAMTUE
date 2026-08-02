"use server";
import { db } from "@/lib/db";
import { getSessao } from "@/lib/auth";

/** Não registra a mesma página de novo dentro desta janela (evita inflar o log em recarregamentos). */
const JANELA_REPETICAO_MIN = 5;

/**
 * Registra a navegação do usuário para alimentar o log individual.
 *
 * Chamada do cliente a cada troca de rota. Deliberadamente NÃO chama
 * `revalidatePath`: isso re-renderizaria a página que acabou de ser aberta e
 * dispararia um novo registro em looping.
 */
export async function registrarPagina(caminho: string) {
  const s = await getSessao();
  if (!s || !caminho.startsWith("/")) return;

  const repetida = await db().prepare(
    `SELECT id FROM audit_log
      WHERE user_id = ? AND acao = 'pagina_visitada' AND detalhes = ?
        AND criado_em > datetime('now', ?)
      LIMIT 1`
  ).get(s.id, caminho, `-${JANELA_REPETICAO_MIN} minutes`);
  if (repetida) return;

  await db()
    .prepare("INSERT INTO audit_log (user_id, acao, detalhes) VALUES (?, 'pagina_visitada', ?)")
    .run(s.id, caminho);
}
