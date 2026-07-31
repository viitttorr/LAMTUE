-- Bloqueio temporario apos tentativas de login incorretas.
ALTER TABLE users ADD COLUMN tentativas_falhas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN bloqueado_ate TEXT;
