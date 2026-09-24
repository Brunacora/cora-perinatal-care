import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Inteiras } from "@/components/Enfase";
import { Logo } from "@/components/Logo";
import { Abajur, SCRIPT_DO_ABAJUR } from "@/components/journal/Abajur";
import { CardsQueEntram, ChegadaDoArtigo, FioDeLeitura } from "@/components/journal/CameraJournal";
import { CapaTipografica } from "@/components/journal/CapaTipografica";
import { CardArtigo } from "@/components/journal/CardArtigo";
import { CorpoArtigo } from "@/components/journal/CorpoArtigo";
import { FromBruna } from "@/components/journal/FromBruna";
import { Indice } from "@/components/journal/Indice";
import { lerCorpo, relacionados, todosOsArtigos } from "@/lib/journal";
import { enderecoDoArtigo, enderecoDoJournal } from "@/lib/journal-endereco";
import { schemaDoArtigo } from "@/lib/journal-schema";
import { schemaToJson } from "@/lib/schema";
import "@/components/journal/journal.css";

/**
 * O ARTIGO (roteiro do blog, Parte 4; design-blog.md, 5.5 a 5.8). A ordem é a do roteiro:
 * etiqueta, título, autoria e tempo, capa, corpo em coluna estreita (com a pausa do meio), fim do
 * texto, escopo profissional quando o tema pede, "From Bruna", três relacionados e o formulário.
 *
 * UM ENDEREÇO SÓ POR ARTIGO: o do idioma em que ele foi escrito. Pedido no idioma errado, ele
 * redireciona (308) para o certo, em vez de servir o mesmo texto em dois endereços.
 */

export async function generateStaticParams() {
  const artigos = await todosOsArtigos();
  return artigos.map((a) => ({ locale: a.idioma, slug: a.slug }));
}

async function buscar(slug: string) {
  const todos = await todosOsArtigos();
  return { artigo: todos.find((a) => a.slug === slug) ?? null, todos };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { artigo } = await buscar(slug);
  if (!artigo) return {};
  const titulo = artigo.tituloGoogle || artigo.titulo;
  const descricao = artigo.descricaoGoogle || artigo.chamada;
  const url = enderecoDoArtigo(artigo);
  return {
    /* o título do artigo já é o título inteiro; a marca vai junto só quando cabe nos 60 */
    title: { absolute: titulo.length <= 38 ? `${titulo} | The Cora Journal` : titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: titulo,
      description: descricao,
      url,
      locale: artigo.idioma === "pt" ? "pt_BR" : "en_US",
      publishedTime: artigo.publicado,
      modifiedTime: artigo.atualizado,
      authors: ["Bruna Gomes"],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  };
}

function mesEAno(data: string, locale: string) {
  const d = new Date(`${data}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export default async function PaginaDoArtigo({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const { artigo, todos } = await buscar(slug);
  if (!artigo) notFound();
  if (artigo.idioma !== locale) permanentRedirect(enderecoDoArtigo(artigo));
  setRequestLocale(locale);

  const t = await getTranslations("journal");
  const corpo = await lerCorpo(slug);
  if (!corpo) notFound();
  const outros = relacionados(artigo, todos);
  const cards = await Promise.all(outros.map((a) => CardArtigo({ artigo: a })));

  return (
    <>
      <Navbar pagina="journal" />
      <main className="artigo-pagina">
        {/* o abajur de quem já escolheu, aceso ANTES da primeira pintura (sem clarão) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_ABAJUR }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToJson(schemaDoArtigo(artigo, t("eyebrow"))) }}
        />
        <article className="artigo" aria-labelledby="artigo-titulo">
          <ChegadaDoArtigo />
          <header id="top" className="artigo-cabeca container-leitura" data-camada="meio">
            <Link href={enderecoDoJournal(locale)} className="artigo-voltar">
              {t("back")}
            </Link>
            <p className="etiqueta">
              <span>{t(`categories.${artigo.categoria}`)}</span>
              {artigo.idioma === "pt" ? <span className="etiqueta-pt">{t("portuguese")}</span> : null}
            </p>
            <h1 id="artigo-titulo" className="artigo-titulo">
              <Inteiras texto={artigo.tela.titulo} />
            </h1>
            <p className="artigo-chamada">{artigo.tela.chamada}</p>
            <div className="artigo-autoria">
              <p className="artigo-autoria-linha">
                <span>{t("byline")}</span>
                <span className="artigo-autoria-tempo">{t("readTime", { minutes: artigo.minutos })}</span>
              </p>
              <p className="artigo-atualizado">{t("updated", { date: mesEAno(artigo.atualizado, locale) })}</p>
              <Abajur rotulo={t("lampOn")} dica={t("lampHint")} />
            </div>
          </header>

          <div className="artigo-capa container-capa" data-camada="frente">
            <CapaTipografica artigo={artigo} tamanho="artigo" prioridade />
          </div>

          <div className="artigo-leitura">
            <FioDeLeitura />
            <Indice titulo={t("toc")} subtitulos={corpo.subtitulos} />
            <CorpoArtigo arvore={corpo.arvore} pausa={{ texto: t("midCta.text"), botao: t("midCta.button") }} />
            {/* o sinal de fim: o texto termina assinado pelo símbolo, como numa revista */}
            <p className="fim-sinal" aria-hidden="true">
              <Logo variante="simbolo" altura={40} rotulo="" />
            </p>
          </div>

          <footer className="artigo-fim container-leitura">
            <section className="fim-cta" aria-labelledby="fim-cta-titulo">
              <h2 id="fim-cta-titulo" className="fim-cta-titulo">
                <Inteiras texto={t("endCta.title")} />
              </h2>
              <p>{t("endCta.text")}</p>
              <a href="#form" className="botao">
                {t("endCta.button")}
              </a>
            </section>
            {artigo.temaDeSaude ? (
              <aside className="escopo">
                <p>{t("scope")}</p>
              </aside>
            ) : null}
          </footer>
        </article>

        <FromBruna />

        {cards.length ? (
          <section className="secao keep-reading" aria-labelledby="keep-reading-titulo">
            <CardsQueEntram escopo=".keep-reading" />
            <div className="container">
              <h2 id="keep-reading-titulo" className="keep-reading-titulo">
                {t("keepReading")}
              </h2>
              <ul className="grade-cards grade-tres">
                {cards.map((c, i) => (
                  <li key={outros[i].slug}>{c}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
      <Footer caminhoIdioma="/journal" />
      <MobileCta suave />
    </>
  );
}
