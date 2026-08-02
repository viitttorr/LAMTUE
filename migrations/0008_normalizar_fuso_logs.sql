-- Normaliza os timestamps para UTC puro.
--
-- Contexto: o schema usava `datetime('now','localtime')`. No Worker (que roda
-- em UTC) isso ja gravava UTC, mas as linhas criadas antes da migracao para o
-- Cloudflare vieram do SQLite local rodando em Brasilia (UTC-3), entao estao
-- 3h atrasadas em relacao ao restante. Somar 3h nessas linhas deixa a coluna
-- inteira em UTC, e a exibicao passa a converter para Brasilia no fmtData.
--
-- O corte e a data de virada para o Cloudflare (2026-07-28).
UPDATE audit_log
   SET criado_em = datetime(criado_em, '+3 hours')
 WHERE criado_em < '2026-07-28';

-- Defaults das tabelas passam a ser UTC explicito, sem o 'localtime' enganoso.
-- (SQLite nao permite ALTER COLUMN DEFAULT; novas tabelas ja nascem corretas e
--  as existentes recebem o valor pela aplicacao, que agora usa datetime('now').)
