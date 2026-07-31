-- Liberacao programada do gabarito do processo seletivo: contagem regressiva
-- (horario absoluto UTC) e PDF opcional do gabarito oficial, mostrados ao
-- candidato quando a contagem expira.
ALTER TABLE seletivo ADD COLUMN gabarito_libera_em TEXT;
ALTER TABLE seletivo ADD COLUMN gabarito_arquivo_id INTEGER REFERENCES arquivos(id);
