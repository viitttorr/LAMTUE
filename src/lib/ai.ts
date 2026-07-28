import { db } from "./db";

export type Questao = {
  enunciado: string;
  alternativas: string[];
  correta: number;
  comentario: string;
};

/**
 * Gera questões de múltipla escolha. Com ANTHROPIC_API_KEY definida, usa a
 * API da Anthropic e persiste as questões geradas no banco (origem 'ia',
 * pendentes de revisão). Sem a chave, sorteia do banco de questões aprovadas.
 */
export async function gerarQuestoes(tema: string, quantidade: number, dificuldade: string): Promise<{ questoes: Questao[]; origem: "ia" | "banco" }> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const questoes = await gerarViaIA(tema, quantidade, dificuldade);
      const ins = db().prepare(
        "INSERT INTO questoes (tema, dificuldade, enunciado, alternativas, correta, comentario, origem, aprovada) VALUES (?, ?, ?, ?, ?, ?, 'ia', 0)"
      );
      for (const q of questoes) await ins.run(tema, dificuldade, q.enunciado, JSON.stringify(q.alternativas), q.correta, q.comentario);
      return { questoes, origem: "ia" };
    } catch (e) {
      console.error("Falha na geração por IA, usando banco de questões:", e);
    }
  }
  return { questoes: await doBanco(tema, quantidade, dificuldade), origem: "banco" };
}

async function doBanco(tema: string, quantidade: number, dificuldade: string): Promise<Questao[]> {
  let rows = (await db().prepare(
    "SELECT enunciado, alternativas, correta, comentario FROM questoes WHERE tema = ? AND dificuldade = ? AND aprovada = 1 ORDER BY RANDOM() LIMIT ?"
  ).all(tema, dificuldade, quantidade)) as { enunciado: string; alternativas: string; correta: number; comentario: string | null }[];
  if (rows.length < quantidade) {
    const extra = (await db().prepare(
      "SELECT enunciado, alternativas, correta, comentario FROM questoes WHERE tema = ? AND aprovada = 1 AND dificuldade != ? ORDER BY RANDOM() LIMIT ?"
    ).all(tema, dificuldade, quantidade - rows.length)) as typeof rows;
    rows = rows.concat(extra);
  }
  return rows.map((r) => ({
    enunciado: r.enunciado,
    alternativas: JSON.parse(r.alternativas),
    correta: r.correta,
    comentario: r.comentario ?? "",
  }));
}

async function gerarViaIA(tema: string, quantidade: number, dificuldade: string): Promise<Questao[]> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const nivel = { facil: "fácil (conceitos fundamentais)", media: "média (aplicação clínica direta)", dificil: "difícil (casos complexos e condutas)" }[dificuldade] ?? "média";
  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `Você é docente de medicina de emergência elaborando questões para a LAMTUE (liga acadêmica de trauma, urgência e emergência).

Gere exatamente ${quantidade} questões de múltipla escolha sobre o tema "${tema}", nível ${nivel}, em português do Brasil, seguindo diretrizes atuais (ATLS, ACLS/BLS-AHA, PHTLS quando pertinente).

Responda SOMENTE com JSON válido, sem markdown, neste formato:
[{"enunciado":"...","alternativas":["...","...","...","..."],"correta":0,"comentario":"explicação do gabarito"}]

Regras: 4 alternativas por questão; "correta" é o índice (0 a 3); comentário didático de 2 a 4 frases citando a conduta correta.`,
      },
    ],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Resposta da IA sem JSON.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as Questao[];
  return parsed
    .filter((q) => q.enunciado && Array.isArray(q.alternativas) && q.alternativas.length >= 4 && q.correta >= 0 && q.correta < q.alternativas.length)
    .slice(0, quantidade);
}

/** Temas com maior taxa de erro do ligante (para sugerir reforço na trilha). */
export async function temasComMaisErros(userId: number): Promise<{ tema: string; taxaErro: number }[]> {
  const rows = (await db().prepare(
    "SELECT tema, AVG(score) AS media, COUNT(*) AS n FROM simulados WHERE user_id = ? AND score IS NOT NULL GROUP BY tema HAVING n >= 1 ORDER BY media ASC LIMIT 3"
  ).all(userId)) as { tema: string; media: number }[];
  return rows.filter((r) => r.media < 70).map((r) => ({ tema: r.tema, taxaErro: Math.round(100 - r.media) }));
}
