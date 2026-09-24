import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* Só em desenvolvimento: o assistente do painel (Keystatic) redireciona para 127.0.0.1, e o Next
     bloqueia os recursos de dev servidos para uma origem que não é "localhost". */
  allowedDevOrigins: ["127.0.0.1"],
  /* O guia do painel para a Bruna (2026-09-24): página estática em public/guia-do-painel, fora do
     roteamento de idioma (ver o matcher do proxy) e fora do Google. */
  async rewrites() {
    return { beforeFiles: [{ source: "/guia-do-painel", destination: "/guia-do-painel/index.html" }] };
  },
  async headers() {
    return [{ source: "/guia-do-painel/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/guia-do-painel", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 90 para as fotos da cliente. A 75 padrao amolece rosto e tecido quando a foto
    // ainda por cima e recortada por object-fit: cover.
    qualities: [75, 90],
  },
};

export default withNextIntl(nextConfig);
