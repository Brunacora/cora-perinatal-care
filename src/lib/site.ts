import { IDIOMAS_PUBLICADOS, routing, type Locale } from "@/i18n/routing";

/**
 * O ENDEREÇO PÚBLICO DO SITE: fonte única (skill `seo-e-medicao`).
 *
 * Canônica, hreflang, sitemap, robots, cartão de compartilhamento e dados estruturados leem daqui,
 * e nenhum deles escreve endereço à mão: foi um endereço cravado que, no site da Carina, fez a
 * canônica e o hreflang apontarem para o domínio da Vercel, dizendo ao Google que a versão oficial
 * era a de preview.
 */

export { IDIOMAS_PUBLICADOS };

/** Lê uma origem sem deixar um valor malformado derrubar o site: o proxy roda em toda requisição. */
function lerOrigem(valor: string | undefined, prefixo = ""): URL | null {
  const limpo = valor?.trim();
  if (!limpo) return null;
  try {
    return new URL(prefixo + limpo);
  } catch {
    return null;
  }
}

/**
 * O domínio OFICIAL (`NEXT_PUBLIC_SITE_URL`). Entra na Vercel no dia em que coraperinatalcare.com
 * apontar para este site. Variável `NEXT_PUBLIC_*` é embutida no BUILD: trocar o valor pede build
 * novo, e um redeploy que reaproveita o cache devolve o valor velho.
 */
const oficial = lerOrigem(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * Antes do domínio, o endereço de produção que a própria Vercel dá ao projeto. É o link que vai
 * para a Bruna aprovar, e canônica, sitemap e a imagem do cartão do WhatsApp precisam apontar para
 * onde o site ESTÁ: apontando para o domínio, que ainda mostra o site antigo, o cartão chegaria sem
 * imagem. Em desenvolvimento não existe nenhum dos dois, e vale o localhost.
 */
const producaoNaVercel = lerOrigem(process.env.VERCEL_PROJECT_PRODUCTION_URL, "https://");

/** Origem sem barra no fim, para `${SITE_URL}/caminho` nunca gerar barra dupla. */
export const SITE_URL = (oficial ?? producaoNaVercel)?.origin ?? "http://localhost:3000";

/**
 * O host oficial, ou null enquanto o domínio não existe. Só ele é indexável: o proxy manda
 * `noindex` para todo `.vercel.app` e, quando há domínio oficial, para qualquer outro host.
 */
export const SITE_HOST: string | null = oficial ? oficial.host.toLowerCase() : null;

/**
 * O idioma do CONTEÚDO que uma rota serve: o dela, se já publicado; senão, o padrão. Enquanto o
 * português não chega, `/pt` serve inglês, e por isso se declara em inglês, aponta a raiz como
 * canônica e fica fora do sitemap. Anunciar ao Google uma página "em português" servindo inglês é
 * o erro clássico de hreflang, e ele descarta o conjunto inteiro.
 */
export function idiomaDoConteudo(locale: string): Locale {
  return (IDIOMAS_PUBLICADOS as readonly string[]).includes(locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}

/**
 * A etiqueta do `<html lang>`. O português do site é o do Brasil, e dizer isso faz o leitor de tela
 * escolher a voz certa. O hreflang continua "pt": ele fala com quem lê português, de onde for.
 */
export function etiquetaDoIdioma(locale: string): string {
  return idiomaDoConteudo(locale) === "pt" ? "pt-BR" : "en";
}

/** Onde cada idioma vive: o padrão na raiz, os outros com prefixo (`localePrefix: "as-needed"`). */
export function localePath(locale: string): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

/**
 * Caminho interno vira endereço absoluto. A raiz sai SEM barra no fim, a mesma forma que o Next
 * escreve no `<link rel="canonical">`: sitemap e página escrevendo diferente viram divergência à
 * toa no Search Console.
 */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
