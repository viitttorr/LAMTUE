-- Edital em PDF do processo seletivo, além do texto livre já existente.
-- Disponível para download público e na área do candidato.
ALTER TABLE seletivo ADD COLUMN edital_arquivo_id INTEGER REFERENCES arquivos(id);
