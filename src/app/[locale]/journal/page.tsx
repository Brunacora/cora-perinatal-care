import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Enfase } from "@/components/Enfase";
import { SimboloDesenhado } from "@/components/ui/SimboloDesenhado";
import { CameraTopoJournal } from "@/components/journal/CameraJournal";
import { CapaTipografica } from "@/components/journal/CapaTipografica";
import { CardArtigo } from "@/components/journal/CardArtigo";
import { FromBruna } from "@/components/journal/FromBruna";
import { GradeJournal } from "@/components/journal/GradeJournal";
import { artigoEmDestaque, todosOsArtigos } from "@/lib/journal";
import { enderecoDoArtigo, enderecoDoJournal } from "@/lib/journal-endereco";
import { schemaDoJournal } from "@/lib/journal-schema";
import { schemaToJson } from "@/lib/schema";
import { IDIOMAS_PUBLICADOS, idiomaDoConteudo } from "@/lib/site";
import { routing } from "@/i18n/routing";
import "@/components/journal/journal.css";

/**
 * THE CORA JOURNAL, a listagem (roteiro do blog, Partes 2, 3 e 5; design-blog.md).
 * Fluxo do roteiro: título da página, "Start here", filtros, grade, "From Bruna", formulário.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const idioma = idiomaDoConteudo(locale);
  const t = await getTranslations({ locale: idioma, namespace: "journal" });
  const versoes =
    IDIOMAS_PUBLICADOS.length > 1
      ? {
          ...Object.fromEntries(IDIOMAS_PUBLICADOS.map((l) => [l, enderecoDoJournal(l)])),
          "x-default": enderecoDoJournal(routing.defaultLocale),
        }
      : undefined;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: enderecoDoJournal(idioma), ...(versoes ? { languages: versoes } : {}) },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: enderecoDoJournal(idioma),
      locale: idioma === "pt" ? "pt_BR" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function Journal({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("journal");

  const todos = await todosOsArtigos();
  const destaque = await artigoEmDestaque();
  /* em `/pt`, os artigos escritos em português vêm primeiro (design-blog.md, seção 8) */
  const ordem =
    locale === "pt" ? [...todos].sort((a, b) => Number(b.idioma === "pt") - Number(a.idioma === "pt")) : todos;
  const naGrade = ordem.filter((a) => a.slug !== destaque?.slug);

  const itens = await Promise.all(
    naGrade.map(async (a) => ({
      slug: a.slug,
      categoria: a.categoria,
      idioma: a.idioma,
      card: await CardArtigo({ artigo: a }),
    })),
  );

  const categorias = ["you-are-seen", "what-no-one-told-you", "behind-cora", "brazilian-roots", "where-to-start"];
  const filtros = [
    { id: "all", rotulo: t("all") },
    ...categorias.map((c) => ({ id: c, rotulo: t(`categories.${c}`) })),
    { id: "pt", rotulo: t("portuguese"), cultural: true },
  ];

  return (
    <>
      <Navbar pagina="journal" />
      <main className="journal">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: schemaToJson(schemaDoJournal(locale, todos, t("eyebrow"), t("metaDescription"))),
          }}
        />

        {/* TOPO: sem banner. O título grande, o apoio curto e o símbolo da marca em marca d'água,
            que no Passe 3 se desenha a uma tinta (pico 1 do blog). */}
        <section id="top" className="journal-topo" aria-labelledby="journal-titulo">
          <CameraTopoJournal />
          <div className="container journal-topo-texto" data-camada="meio">
            {/* o símbolo inteiro, ao lado do título (segunda coluna do topo no desktop) */}
            <div className="journal-marca" data-camada="fundo" aria-hidden="true">
              <SimboloDesenhado />
            </div>
            <p className="etiqueta journal-etiqueta">{t("eyebrow")}</p>
            <h1 id="journal-titulo" className="journal-titulo">
              <Enfase texto={t("title")} palavra={t("titleEmphasis")} />
            </h1>
            <p className="journal-intro corpo-grande">{t("intro")}</p>
          </div>
        </section>

        {destaque ? (
          <section className="start-here" aria-labelledby="start-here-rotulo">
            <div className="container">
              <article className="start-here-card" lang={destaque.idioma === "pt" ? "pt-BR" : "en"}>
                <Link href={enderecoDoArtigo(destaque)} className="start-here-capa arco-abre" data-camada="frente" tabIndex={-1} aria-hidden="true">
                  <CapaTipografica artigo={destaque} tamanho="destaque" prioridade />
                </Link>
                <div className="start-here-texto" data-camada="meio">
                  <p id="start-here-rotulo" className="start-here-rotulo">
                    {t("startHere")}
                  </p>
                  <p className="etiqueta">
                    <span>{t(`categories.${destaque.categoria}`)}</span>
                    {destaque.idioma === "pt" ? <span className="etiqueta-pt">{t("portuguese")}</span> : null}
                  </p>
                  <h2 className="start-here-titulo">{destaque.tela.titulo}</h2>
                  <p className="start-here-chamada">{destaque.tela.chamada}</p>
                  <p className="card-artigo-tempo">{t("readTime", { minutes: destaque.minutos })}</p>
                  <Link href={enderecoDoArtigo(destaque)} className="link-linha">
                    {t("readThis")}
                    <span className="sr-only">: {destaque.titulo}</span>
                  </Link>
                </div>
              </article>
            </div>
          </section>
        ) : null}

        <section className="journal-grade" aria-label={t("eyebrow")}>
          <div className="container">
            <GradeJournal
              itens={itens}
              filtros={filtros}
              rotuloFiltros={t("filtersLabel")}
              textoVazio={t("empty")}
              textoMais={t("loadMore")}
              textoMostrando={t.raw("shown") as string}
              tituloGrade={t("eyebrow")}
            />
          </div>
        </section>

        <FromBruna />
      </main>
      <Footer caminhoIdioma="/journal" />
      <MobileCta />
    </>
  );
}
