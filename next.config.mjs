/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "pdfkit",
    "@whiskeysockets/baileys",
    "nodemailer",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;

// Habilita os bindings reais (D1, R2) no `next dev` local via Miniflare,
// usando o mesmo wrangler.jsonc do deploy.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
