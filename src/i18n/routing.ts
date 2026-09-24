import { defineRouting } from "next-intl/routing";

/**
 * Os idiomas que JÁ TÊM copy própria. Acrescentar um idioma aqui acerta o resto sozinho: canônica,
 * hreflang, sitemap, o `lang` da página, o seletor do rodapé e a detecção do idioma do navegador
 * (ver `lib/site.ts`).
 *
 * O PORTUGUÊS entrou em 2026-09-11: tradução nossa, autorizada pelo Gabriel, que a Bruna revisa no
 * link de aprovação. Perinatal é saúde: antes do domínio oficial, ou ela aprova, ou o "pt" sai
 * desta lista (pendencias-cora.md).
 */
export const IDIOMAS_PUBLICADOS: readonly ("en" | "pt")[] = ["en", "pt"];

// Inglês no ar, português já arquitetado (briefing.md, seção 3).
export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
  /* O inglês mora na RAIZ e o português em "/pt". Com o padrão do next-intl ("always"), a raiz
     respondia 307 para "/en" enquanto a canônica e o hreflang declaravam a raiz: o Google recebia
     como endereço oficial um endereço que redireciona. Medido em 2026-09-11 (Passe 4). */
  localePrefix: "as-needed",
  /* A RAIZ SEMPRE ABRE EM INGLÊS (decisão do Gabriel, 2026-09-11). Com a detecção ligada, o
     middleware lia o `Accept-Language` do navegador: quem está com o aparelho em português caía
     em "/pt" sem nunca ver a versão em inglês, que é a principal do negócio (Massachusetts e New
     Hampshire). Desligada, o idioma vem SÓ DA URL: a raiz é inglês, "/pt" é português, e a troca
     é escolha do visitante, no seletor do rodapé ou da gaveta do menu.
     Isto também para de ler o cookie `NEXT_LOCALE`, então a escolha não sobrevive à próxima
     visita. É o comportamento pedido: sempre começa em inglês, e quem quiser muda depois. */
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
