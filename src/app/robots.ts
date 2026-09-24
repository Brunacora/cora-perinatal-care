import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `/robots.txt`, servido pelo framework (skill `seo-e-medicao`), com o sitemap saindo da mesma
 * fonte de endereço do resto do site (`lib/site.ts`).
 *
 * Libera o site inteiro: é uma página só, sem área privada. Quem tira o `.vercel.app` do índice é
 * o cabeçalho `X-Robots-Tag` do `proxy.ts`, e não um `Disallow` aqui: este arquivo é o mesmo em
 * qualquer host, e `Disallow` impediria o robô de chegar à página e ler o `noindex`.
 *
 * OS ROBÔS DE IA, NOMEADOS UM A UM. Não muda comportamento (a regra `*` já libera todos): declara a
 * intenção por escrito, para ninguém "endurecer" este arquivo um dia e fechar sem saber a porta
 * pela qual o ChatGPT, o Claude, o Perplexity e o Gemini chegam ao site. `GPTBot` coleta para
 * treino, `OAI-SearchBot` alimenta a busca do ChatGPT e `ChatGPT-User` abre a página a pedido de
 * alguém; `Google-Extended` é o controle do Gemini, separado da Busca; o `Bingbot` entra porque o
 * índice do Bing alimenta o ChatGPT.
 */
const ROBOS_DE_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...ROBOS_DE_IA.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
