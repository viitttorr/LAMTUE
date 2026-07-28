/**
 * Cargos de diretoria pré-definidos — mantidos como lista fechada para que as
 * checagens de permissão em auth.ts (que casam substrings como "presidente",
 * "tesoureiro", "comunica") continuem previsíveis. Sem import de db.ts aqui
 * de propósito: este arquivo precisa ser seguro para uso em componentes
 * client ("use client"), e db.ts depende de bindings do Cloudflare Workers.
 */
export const CARGOS_DIRETORIA = [
  "Presidente",
  "Vice-Presidente / Tesoureiro",
  "Diretora de Administração",
  "Diretora de Ensino e Pesquisa",
  "Diretora de Comunicação e Extensão",
] as const;
