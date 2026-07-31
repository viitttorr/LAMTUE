import { getCloudflareContext } from "@opennextjs/cloudflare";

export const TEMAS = [
  "ABCDE do Trauma",
  "Via Aérea e Intubação",
  "Suporte Básico de Vida",
  "Parada Cardiorrespiratória",
  "Choque",
  "Hemorragia",
  "Traumatismo Cranioencefálico",
  "Trauma Torácico",
  "Trauma Abdominal",
  "Trauma de Coluna",
  "Imobilização e Transporte",
  "Triagem START",
  "Queimaduras",
  "Urgências Clínicas",
  "Sutura e Curativos",
  "Oxigenoterapia",
  "Acesso Venoso de Emergência",
] as const;

/** Rótulos do status de inscrição no seletivo — usado na tela da diretoria e no painel do candidato. */
export const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  pendente: { label: "Pendente", badge: "badge-amber" },
  aprovado: { label: "Aprovado", badge: "badge-green" },
  reprovado: { label: "Reprovado", badge: "badge-red" },
  espera: { label: "Lista de espera", badge: "badge-blue" },
};

export const TICKET_STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  aberto: { label: "Em aberto", badge: "badge-amber" },
  em_andamento: { label: "Em andamento", badge: "badge-blue" },
  resolvido: { label: "Resolvido", badge: "badge-green" },
};

export const DIRETORIA = [
  { nome: "Vitor Rossatto", cargo: "Presidente", email: "presidente@lamtue.com" },
  { nome: "Leonardo Pramio", cargo: "Vice-Presidente / Tesoureiro", email: "tesouraria@lamtue.com" },
  { nome: "Alessandra Biazotto", cargo: "Diretora de Administração", email: "administracao@lamtue.com" },
  { nome: "Ciliandra Marin", cargo: "Diretora de Ensino e Pesquisa", email: "ensino@lamtue.com" },
  { nome: "Mylena Maisa Kaminski", cargo: "Diretora de Comunicação e Extensão", email: "comunicacao@lamtue.com" },
];

/**
 * Adaptador fino sobre o D1 que imita os nomes de método do better-sqlite3
 * (`.prepare(sql).get()/.all()/.run()`), só que assíncronos por baixo — para
 * minimizar a mudança nos ~150 pontos de chamada existentes (cada um só
 * ganha um `await` na frente, sem reescrever a query).
 */
class D1Stmt {
  constructor(private raw: D1PreparedStatement) {}

  private bound(params: unknown[]): D1PreparedStatement {
    return params.length ? this.raw.bind(...params) : this.raw;
  }

  async get<T = Record<string, unknown>>(...params: unknown[]): Promise<T | undefined> {
    const row = await this.bound(params).first<T>();
    return row ?? undefined;
  }

  async all<T = Record<string, unknown>>(...params: unknown[]): Promise<T[]> {
    const { results } = await this.bound(params).all<T>();
    return results;
  }

  async run(...params: unknown[]): Promise<{ lastInsertRowid: number; changes: number }> {
    const res = await this.bound(params).run();
    return { lastInsertRowid: Number(res.meta.last_row_id ?? 0), changes: res.meta.changes ?? 0 };
  }
}

class D1Db {
  constructor(private d1: D1Database) {}
  prepare(sql: string): D1Stmt {
    return new D1Stmt(this.d1.prepare(sql));
  }
}

export function db(): D1Db {
  const { env } = getCloudflareContext();
  if (!env.lamtue_db) throw new Error("Binding D1 'lamtue_db' não encontrado — confira o wrangler.jsonc.");
  return new D1Db(env.lamtue_db);
}

/** Bucket R2 de arquivos enviados (materiais, comprovantes, fotos da galeria). */
export function arquivosBucket(): R2Bucket {
  const { env } = getCloudflareContext();
  if (!env.lamtue_arquivos) throw new Error("Binding R2 'lamtue_arquivos' não encontrado — confira o wrangler.jsonc.");
  return env.lamtue_arquivos;
}

export async function getConfig(chave: string, fallback = ""): Promise<string> {
  const row = await db().prepare("SELECT valor FROM config WHERE chave = ?").get<{ valor: string }>(chave);
  return row ? row.valor : fallback;
}

export async function setConfig(chave: string, valor: string): Promise<void> {
  await db()
    .prepare("INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor")
    .run(chave, valor);
}

/** Frequência de um ligante: aulas com chamada registrada vs presenças. */
export async function frequenciaDe(userId: number) {
  const total = (await db()
    .prepare("SELECT COUNT(DISTINCT aula_id) AS n FROM presencas WHERE aula_id IN (SELECT aula_id FROM presencas WHERE user_id = ?)")
    .get<{ n: number }>(userId))!.n;
  const presentes = (await db()
    .prepare("SELECT COUNT(*) AS n FROM presencas WHERE user_id = ? AND presente = 1")
    .get<{ n: number }>(userId))!.n;
  const pct = total === 0 ? 100 : Math.round((presentes / total) * 100);
  return { total, presentes, pct, elegivel: total === 0 ? false : presentes / total >= 2 / 3 };
}
