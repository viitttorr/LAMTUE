-- Adiciona turma às inscrições do seletivo, para permitir a importação em
-- massa via CSV (nome;email;matricula;telefone;turma) com o mesmo calculo
-- automatico de semestre ja usado para ligantes.
ALTER TABLE inscricoes ADD COLUMN turma TEXT;
