-- Sistema de tickets: candidatos/ligantes abrem (ex.: contestacao de
-- resultado do seletivo), diretoria visualiza todos e responde.
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assunto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','resolvido')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS ticket_mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  autor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_ticket_mensagens_ticket ON ticket_mensagens(ticket_id);
