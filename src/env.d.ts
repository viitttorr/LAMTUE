// Bindings do Worker (declarados em wrangler.jsonc), disponíveis via getCloudflareContext().env
declare global {
  interface CloudflareEnv {
    lamtue_db: D1Database;
    lamtue_arquivos: R2Bucket;
    RUNTIME?: string;
  }
}

export {};
