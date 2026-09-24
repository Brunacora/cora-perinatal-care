/**
 * Onde cada artigo mora. Um endereço canônico só, no idioma em que ele foi ESCRITO (design-blog.md,
 * seção 8): inglês na raiz, português em `/pt`, e o slug sempre em inglês. Sem `server-only`: o
 * cliente também monta links.
 */
export function enderecoDoArtigo(a: { slug: string; idioma: "en" | "pt" }): string {
  return a.idioma === "pt" ? `/pt/journal/${a.slug}` : `/journal/${a.slug}`;
}

export function enderecoDoJournal(locale: string): string {
  return locale === "en" ? "/journal" : `/${locale}/journal`;
}
