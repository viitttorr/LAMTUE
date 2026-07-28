-- Schema inicial do portal LAMTUE no D1.
-- Espelha o schema final que existia em src/lib/db.ts (better-sqlite3 local),
-- já na forma definitiva: users.role inclui 'candidato' e a coluna turma,
-- inscricoes já tem user_id — sem precisar repetir as migrações incrementais
-- que existiam para evoluir um banco SQLite local já em uso.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  matricula TEXT UNIQUE,
  telefone TEXT,
  semestre TEXT,
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ligante','diretoria','candidato')),
  cargo TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  turma TEXT
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
  alternativas TEXT NOT NULL,
  correta INTEGER NOT NULL,
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
  questoes TEXT NOT NULL,
  respostas TEXT,
  score REAL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  finalizado_em TEXT
);

CREATE TABLE IF NOT EXISTS casos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tema TEXT NOT NULL,
  contexto TEXT NOT NULL,
  etapas TEXT NOT NULL,
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
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS seletivo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ativo INTEGER NOT NULL DEFAULT 0,
  vagas INTEGER NOT NULL DEFAULT 20,
  prazo TEXT,
  taxa_centavos INTEGER NOT NULL DEFAULT 0,
  edital TEXT,
  cronograma TEXT
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
