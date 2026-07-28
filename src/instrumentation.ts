export async function register() {
  // No Workers, uma isolate não sobrevive entre requisições da mesma forma que um
  // processo Node — um setInterval de 30min não tem garantia de continuar rodando,
  // e o contexto do Cloudflare (getCloudflareContext) só existe durante uma
  // requisição ativa. O lembrete automático de aula fica desativado nessa hospedagem.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.RUNTIME !== "cloudflare") {
    const { iniciarAgendador } = await import("./lib/scheduler");
    iniciarAgendador();
  }
}
