-- Numero de acertos do candidato na prova do processo seletivo (21 questoes).
-- 0 = gabarito ainda nao lancado pela diretoria.
ALTER TABLE inscricoes ADD COLUMN acertos INTEGER NOT NULL DEFAULT 0;
