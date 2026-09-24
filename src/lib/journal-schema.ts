import { SITE_URL, absoluteUrl } from "@/lib/site";
import type { Artigo } from "@/lib/journal";
import { enderecoDoArtigo, enderecoDoJournal } from "@/lib/journal-endereco";

/**
 * Dados estruturados do journal (skill `seo-e-medicao`; pendências do blog, Passe 4).
 *
 * O artigo é `BlogPosting` com a data REAL de publicação e a de atualização (o roteiro esconde a
 * data de publicação da página e manda que ela viva aqui, "onde o Google precisa dela"). A autora é
 * o MESMO nó da Bruna que a home declara (`/#bruna`), e o journal é um `Blog` publicado pelo
 * negócio (`/#negocio`). Nenhuma avaliação, nenhuma estrela.
 */
const idNegocio = `${SITE_URL}/#negocio`;
const idBruna = `${SITE_URL}/#bruna`;
const idioma = (i: "en" | "pt") => (i === "pt" ? "pt-BR" : "en-US");

export function schemaDoJournal(locale: string, artigos: Artigo[], nome: string, descricao: string) {
  const url = absoluteUrl(enderecoDoJournal(locale));
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl("/journal")}#blog`,
    url,
    name: nome,
    description: descricao,
    inLanguage: idioma(locale === "pt" ? "pt" : "en"),
    publisher: { "@id": idNegocio },
    author: { "@id": idBruna },
    blogPost: artigos.map((a) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(enderecoDoArtigo(a))}#artigo`,
      headline: a.titulo,
      url: absoluteUrl(enderecoDoArtigo(a)),
      datePublished: a.publicado,
      dateModified: a.atualizado,
    })),
  };
}

export function schemaDoArtigo(a: Artigo, nomeDoJournal: string) {
  const url = absoluteUrl(enderecoDoArtigo(a));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#artigo`,
    mainEntityOfPage: url,
    url,
    headline: a.titulo,
    description: a.descricaoGoogle || a.chamada,
    inLanguage: idioma(a.idioma),
    datePublished: a.publicado,
    dateModified: a.atualizado,
    author: { "@id": idBruna },
    publisher: { "@id": idNegocio },
    isPartOf: { "@type": "Blog", "@id": `${absoluteUrl("/journal")}#blog`, name: nomeDoJournal },
    image: absoluteUrl(`${enderecoDoArtigo(a)}/opengraph-image`),
  };
}
