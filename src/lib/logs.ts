/** Nome da ação como aparece no log — chaves são os valores gravados em audit_log.acao. */
const ROTULO_ACAO: Record<string, string> = {
  // comuns a todos os papéis
  login: "Entrou no portal",
  troca_senha: "Trocou a senha",
  pagina_visitada: "Acessou a página",
  ticket_criado: "Abriu um ticket",
  ticket_respondido: "Respondeu um ticket",
  // ligante / candidato
  simulado_gerado: "Gerou um simulado",
  simulado_finalizado: "Finalizou um simulado",
  trilha_modulo_concluido: "Concluiu módulo da trilha",
  trilha_modulo_desmarcado: "Desmarcou módulo da trilha",
  caso_clinico_resolvido: "Resolveu um caso clínico",
  // diretoria — aulas e frequência
  aula_criada: "Criou uma aula",
  aula_editada: "Editou uma aula",
  aula_excluida: "Excluiu uma aula",
  lembrete_aula_enviado: "Enviou lembrete de aula",
  chamada_confirmada: "Confirmou a chamada",
  // diretoria — contas
  membro_cadastrado: "Cadastrou uma conta",
  membro_editado: "Editou uma conta",
  membro_ativado_desativado: "Ativou/desativou uma conta",
  membro_senha_redefinida: "Redefiniu a senha de uma conta",
  ligantes_importados: "Importou ligantes",
  aprovados_matriculados: "Matriculou os aprovados",
  candidato_conta_criada: "Criou conta de candidato",
  // diretoria — conteúdo
  material_publicado: "Publicou um material",
  material_excluido: "Excluiu um material",
  questao_criada: "Criou uma questão",
  questao_aprovada: "Aprovou uma questão",
  questao_excluida: "Excluiu uma questão",
  questoes_importadas: "Importou questões",
  caso_criado: "Criou um caso clínico",
  caso_editado: "Editou um caso clínico",
  caso_excluido: "Excluiu um caso clínico",
  casos_importados: "Importou casos clínicos",
  evento_criado: "Criou um evento",
  extensao_criada: "Criou uma ação de extensão",
  album_criado: "Criou um álbum",
  album_excluido: "Excluiu um álbum",
  fotos_adicionadas: "Adicionou fotos",
  foto_excluida: "Excluiu uma foto",
  // diretoria — seletivo
  seletivo_configurado: "Configurou o seletivo",
  edital_pdf_removido: "Removeu o PDF do edital",
  gabarito_configurado: "Configurou a liberação do gabarito",
  gabarito_pdf_removido: "Removeu o PDF do gabarito",
  inscricao_manual_criada: "Cadastrou candidato manualmente",
  inscricao_excluida: "Excluiu uma inscrição",
  inscricao_status: "Alterou o status de uma inscrição",
  inscricao_acertos_lote: "Atualizou o gabarito em lote",
  inscritos_importados: "Importou candidatos",
  resultado_enviado: "Enviou resultados",
  // diretoria — comunicação e sistema
  aviso_publicado: "Publicou um aviso",
  mensagem_manual_enviada: "Enviou mensagem manual",
  whatsapp_conectar: "Conectou o WhatsApp",
  whatsapp_desconectar: "Desconectou o WhatsApp",
  lancamento_financeiro: "Registrou lançamento financeiro",
  lancamento_excluido: "Excluiu lançamento financeiro",
  configuracoes_salvas: "Salvou as configurações",
  certificados_liberados: "Liberou os certificados",
  site_status_alterado: "Alterou o status do site",
  relatorio_exportado: "Exportou um relatório",
};

/** Caminho → nome amigável da página, para o log de navegação. */
const ROTULO_PAGINA: Record<string, string> = {
  "/diretoria": "Dashboard",
  "/diretoria/frequencia": "Frequência",
  "/diretoria/ligantes": "Ligantes",
  "/diretoria/aulas": "Aulas",
  "/diretoria/materiais": "Materiais",
  "/diretoria/questoes": "Questões",
  "/diretoria/casos": "Casos Clínicos",
  "/diretoria/seletivo": "Seletivo",
  "/diretoria/notificacoes": "Notificações",
  "/diretoria/tickets": "Tickets",
  "/diretoria/whatsapp": "WhatsApp",
  "/diretoria/conteudo": "Site Público",
  "/diretoria/relatorios": "Relatórios",
  "/diretoria/galeria": "Galeria",
  "/diretoria/financeiro": "Financeiro",
  "/diretoria/logs": "Log de um usuário",
  "/ligante": "Painel",
  "/ligante/mural": "Mural",
  "/ligante/presencas": "Presenças",
  "/ligante/biblioteca": "Biblioteca",
  "/ligante/simulados": "Simulados",
  "/ligante/casos": "Casos Clínicos",
  "/ligante/trilha": "Trilha",
  "/ligante/certificado": "Certificado",
  "/ligante/tickets": "Tickets",
  "/candidato": "Painel",
  "/candidato/mural": "Mural",
  "/candidato/presencas": "Presenças",
  "/candidato/biblioteca": "Biblioteca",
  "/candidato/simulados": "Simulados",
  "/candidato/casos": "Casos Clínicos",
  "/candidato/trilha": "Trilha",
  "/candidato/certificado": "Certificado",
  "/candidato/tickets": "Tickets",
};

export function rotuloPagina(path: string): string {
  if (ROTULO_PAGINA[path]) return ROTULO_PAGINA[path];
  // rotas com id (ex.: /diretoria/tickets/12) caem no rótulo do pai
  const pai = path.replace(/\/[^/]+$/, "");
  if (ROTULO_PAGINA[pai]) return `${ROTULO_PAGINA[pai]} (detalhe)`;
  return path;
}

/** Texto exibido para uma linha do log. */
export function descreverAcao(acao: string, detalhes: string | null): { titulo: string; complemento: string | null } {
  if (acao === "pagina_visitada") {
    return { titulo: "Acessou", complemento: detalhes ? rotuloPagina(detalhes) : null };
  }
  return { titulo: ROTULO_ACAO[acao] ?? acao.replace(/_/g, " "), complemento: detalhes };
}

/** Ações que contam como "acesso" no log geral do dashboard. */
export const ACOES_DE_ACESSO = ["login"];
