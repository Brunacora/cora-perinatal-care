import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // 90 para as fotos da cliente. A 75 padrao amolece rosto e tecido quando a foto
    // ainda por cima e recortada por object-fit: cover.
    qualities: [75, 90],
  },
};

export default withNextIntl(nextConfig);
