import type { MetadataRoute } from "next";
import { IDIOMAS_PUBLICADOS, absoluteUrl, localePath } from "@/lib/site";
import { todosOsArtigos } from "@/lib/journal";
import { enderecoDoArtigo, enderecoDoJournal } from "@/lib/journal-endereco";

/**
 * `/sitemap.xml`, gerado da MESMA lista de idiomas publicados que a canônica e o hreflang usam
 * (`i18n/routing.ts`), nunca de uma segunda lista: uma entrada por idioma publicado (a raiz em
 * inglês e o `/pt`), cada uma com o hreflang que o Google exige autorreferente (cada versão cita
 * todas, inclusive ela mesma).
 *
 * O JOURNAL (2026-09-23): a listagem nos dois idiomas, e cada artigo UMA vez, no endereço do idioma
 * em que foi escrito, com a data REAL da última atualização que a Bruna marca no painel.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const comIdiomas = (caminho: (l: string) => string) =>
    IDIOMAS_PUBLICADOS.length > 1
      ? {
          alternates: {
            languages: Object.fromEntries(IDIOMAS_PUBLICADOS.map((l) => [l, absoluteUrl(caminho(l))])),
          },
        }
      : {};

  const home = IDIOMAS_PUBLICADOS.map((locale) => ({
    url: absoluteUrl(localePath(locale)),
    /* a data do BUILD: num site de página única, é a "última publicação" mais honesta sem inventar
       data */
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
    ...comIdiomas(localePath),
  }));

  const artigos = await todosOsArtigos();
  const maisRecente = artigos.map((a) => a.atualizado).sort().at(-1);

  const journal = IDIOMAS_PUBLICADOS.map((locale) => ({
    url: absoluteUrl(enderecoDoJournal(locale)),
    lastModified: maisRecente ? new Date(maisRecente) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    ...comIdiomas(enderecoDoJournal),
  }));

  const posts = artigos.map((a) => ({
    url: absoluteUrl(enderecoDoArtigo(a)),
    lastModified: new Date(a.atualizado),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...home, ...journal, ...posts];
}
