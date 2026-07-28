import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

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

export const DIRETORIA = [
  { nome: "Vitor Rossatto", cargo: "Presidente", email: "presidente@lamtue.com" },
  { nome: "Leonardo Pramio", cargo: "Vice-Presidente / Tesoureiro", email: "tesouraria@lamtue.com" },
  { nome: "Alessandra Biazotto", cargo: "Diretora de Administração", email: "administracao@lamtue.com" },
  { nome: "Ciliandra Marin", cargo: "Diretora de Ensino e Pesquisa", email: "ensino@lamtue.com" },
  { nome: "Mylena Maisa Kaminski", cargo: "Diretora de Comunicação e Extensão", email: "comunicacao@lamtue.com" },
];

const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  _db = new Database(path.join(DATA_DIR, "lamtue.db"));
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE,
    matricula TEXT UNIQUE,
    telefone TEXT,
    semestre TEXT,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ligante','diretoria')),
    cargo TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tema TEXT,
    data TEXT NOT NULL,
    local TEXT,
    descricao TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS presencas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    presente INTEGER NOT NULL DEFAULT 0,
    registrado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE (aula_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS arquivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    mime TEXT NOT NULL,
    tamanho INTEGER NOT NULL,
    caminho TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS materiais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tema TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('slide','pdf','video','link')),
    url TEXT,
    arquivo_id INTEGER REFERENCES arquivos(id),
    visibilidade TEXT NOT NULL DEFAULT 'ligantes' CHECK (visibilidade IN ('publico','ligantes')),
    aula_id INTEGER REFERENCES aulas(id),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS questoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tema TEXT NOT NULL,
    dificuldade TEXT NOT NULL DEFAULT 'media' CHECK (dificuldade IN ('facil','media','dificil')),
    enunciado TEXT NOT NULL,
    alternativas TEXT NOT NULL, -- JSON array de 4-5 strings
    correta INTEGER NOT NULL,   -- índice da alternativa correta
    comentario TEXT,
    origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','ia')),
    aprovada INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS simulados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tema TEXT NOT NULL,
    dificuldade TEXT NOT NULL,
    questoes TEXT NOT NULL,   -- JSON [{enunciado, alternativas, correta, comentario}]
    respostas TEXT,           -- JSON [indices]
    score REAL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    finalizado_em TEXT
  );
  CREATE TABLE IF NOT EXISTS casos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tema TEXT NOT NULL,
    contexto TEXT NOT NULL,
    etapas TEXT NOT NULL, -- JSON [{pergunta, opcoes:[{texto, correta, feedback}]}]
    visibilidade TEXT NOT NULL DEFAULT 'ligantes' CHECK (visibilidade IN ('publico','ligantes')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS casos_resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso_id INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acertos INTEGER NOT NULL,
    total INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS inscricoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    matricula TEXT NOT NULL,
    semestre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    comprovante_id INTEGER REFERENCES arquivos(id),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','reprovado','espera')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS seletivo (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    ativo INTEGER NOT NULL DEFAULT 0,
    vagas INTEGER NOT NULL DEFAULT 20,
    prazo TEXT,
    taxa_centavos INTEGER NOT NULL DEFAULT 0,
    edital TEXT,
    cronograma TEXT -- JSON [{etapa, data}]
  );
  CREATE TABLE IF NOT EXISTS avisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    autor_id INTEGER REFERENCES users(id),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canal TEXT NOT NULL CHECK (canal IN ('email','whatsapp')),
    destinatario TEXT NOT NULL,
    assunto TEXT,
    corpo TEXT NOT NULL,
    evento TEXT NOT NULL,
    status TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
    descricao TEXT NOT NULL,
    valor_centavos INTEGER NOT NULL,
    data TEXT NOT NULL,
    autor_id INTEGER REFERENCES users(id),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    acao TEXT NOT NULL,
    detalhes TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'atividade',
    data TEXT NOT NULL,
    local TEXT,
    descricao TEXT
  );
  CREATE TABLE IF NOT EXISTS producao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    autores TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'trabalho',
    evento TEXT,
    ano INTEGER,
    link TEXT
  );
  CREATE TABLE IF NOT EXISTS extensao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'acao' CHECK (tipo IN ('acao','material')),
    descricao TEXT NOT NULL,
    data TEXT,
    link TEXT,
    arquivo_id INTEGER REFERENCES arquivos(id)
  );
  CREATE TABLE IF NOT EXISTS trilha_progresso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tema TEXT NOT NULL,
    concluido_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE (user_id, tema)
  );
  CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS galeria_albuns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data TEXT,
    visibilidade TEXT NOT NULL DEFAULT 'publico' CHECK (visibilidade IN ('publico','ligantes')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS galeria_fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL REFERENCES galeria_albuns(id) ON DELETE CASCADE,
    arquivo_id INTEGER NOT NULL REFERENCES arquivos(id),
    legenda TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_galeria_fotos_album ON galeria_fotos(album_id);
  `);

  // Seed: diretoria 2026–2027 (senha inicial "lamtue2026", troca obrigatória)
  const count = (d.prepare("SELECT COUNT(*) AS n FROM users WHERE role='diretoria'").get() as { n: number }).n;
  if (count === 0) {
    const hash = bcrypt.hashSync("lamtue2026", 10);
    const ins = d.prepare(
      "INSERT INTO users (nome, email, senha_hash, role, cargo, must_change_password) VALUES (?, ?, ?, 'diretoria', ?, 1)"
    );
    for (const m of DIRETORIA) ins.run(m.nome, m.email, hash, m.cargo);
  }
  d.prepare("INSERT OR IGNORE INTO seletivo (id, ativo) VALUES (1, 0)").run();
  d.prepare("INSERT OR IGNORE INTO config (chave, valor) VALUES ('horas_por_aula','2')").run();
  d.prepare("INSERT OR IGNORE INTO config (chave, valor) VALUES ('periodo_atual','2026/2')").run();
}

export function getConfig(chave: string, fallback = ""): string {
  const row = db().prepare("SELECT valor FROM config WHERE chave = ?").get(chave) as { valor: string } | undefined;
  return row ? row.valor : fallback;
}

export function setConfig(chave: string, valor: string) {
  db().prepare("INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor").run(chave, valor);
}

/** Frequência de um ligante: aulas com chamada registrada vs presenças. */
export function frequenciaDe(userId: number) {
  const total = (db().prepare(
    "SELECT COUNT(DISTINCT aula_id) AS n FROM presencas WHERE aula_id IN (SELECT aula_id FROM presencas WHERE user_id = ?)"
  ).get(userId) as { n: number }).n;
  const presentes = (db().prepare(
    "SELECT COUNT(*) AS n FROM presencas WHERE user_id = ? AND presente = 1"
  ).get(userId) as { n: number }).n;
  const pct = total === 0 ? 100 : Math.round((presentes / total) * 100);
  return { total, presentes, pct, elegivel: total === 0 ? false : presentes / total >= 2 / 3 };
}
