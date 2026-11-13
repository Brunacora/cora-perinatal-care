import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Espinha } from "@/components/ui/Espinha";
import { IDIOMAS_PUBLICADOS, idiomaDoConteudo } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { CAMINHO_DO_GUIA, enderecoDoGuia } from "@/lib/guia-endereco";
import guia from "@/lib/guia-de-servicos.json";
import "@/components/guia/guia.css";

/** uma página do PDF já convertida: o tamanho real reserva o espaço antes de a imagem chegar */
type Pagina = { arquivo: string; largura: number; altura: number };
const paginas = guia.paginas as Pagina[];

/**
 * O GUIA DE SERVIÇOS (quinta rodada da Bruna, 2026-11-13: "tirar os preços e colocar um botão pra
 * pessoa ver esse PDF dentro do site. E chamar ela").
 *
 * O PDF dela, página a página, dentro da moldura do site. As páginas viram IMAGEM em vez de um
 * <iframe> com o PDF porque o Safari do iPhone, dentro de um iframe, mostra só a PRIMEIRA página e
 * não rola: a cliente revisa o site no celular, e o público dela também. O arquivo original continua
 * a um toque, no "Baixar o PDF", para quem quer guardar ou imprimir.
 *
 * "E chamar ela": o rodapé é o mesmo do site, com o formulário, então quem termina de ler o guia
 * chega nele. O botão do topo e o do fim vão para lá ("#form"), com a copy da hero.
 *
 * As páginas e o PDF otimizado saem de `scripts/gera-guia-de-servicos.py`, que também escreve o
 * manifesto `lib/guia-de-servicos.json` (o tamanho real de cada página, para o espaço ser
 * reservado antes de a imagem chegar).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const idioma = idiomaDoConteudo(locale);
  const t = await getTranslations({ locale: idioma, namespace: "guide" });
  const versoes =
    IDIOMAS_PUBLICADOS.length > 1
      ? {
          ...Object.fromEntries(IDIOMAS_PUBLICADOS.map((l) => [l, enderecoDoGuia(l)])),
          "x-default": enderecoDoGuia(routing.defaultLocale),
        }
      : undefined;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: enderecoDoGuia(idioma), ...(versoes ? { languages: versoes } : {}) },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: enderecoDoGuia(idioma),
      locale: idioma === "pt" ? "pt_BR" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function GuiaDeServicos({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const hero = await getTranslations("hero");
  const pacotes = await getTranslations("packages");

  const total = paginas.length;
  /* o peso do PDF ao lado do link: quem está no celular decide se baixa agora */
  const megas = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", { maximumFractionDigits: 1 }).format(
    guia.pdf.bytes / 1048576,
  );
  const nota = t("languageNote");

  return (
    <>
      <Navbar pagina="guia" />
      <main className="guia">
        <section id="top" className="guia-topo" aria-labelledby="guia-titulo">
          <div className="container guia-topo-texto">
            <p className="etiqueta">{t("eyebrow")}</p>
            <h1 id="guia-titulo" className="guia-titulo">
              {t("title")}
            </h1>
            {nota ? <p className="texto-apoio guia-nota">{nota}</p> : null}
            <div className="guia-acoes">
              <a href="#form" className="botao">
                {hero("cta")}
              </a>
              {guia.pdf.arquivo ? (
                <a href={guia.pdf.arquivo} className="link-linha" download data-umami-event="guia-pdf-baixado">
                  {t("download")}
                  <span className="guia-peso"> ({megas} MB)</span>
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="guia-paginas" aria-label={t("title")}>
          <ol className="container guia-lista">
            {paginas.map((p, i) => (
              <li key={p.arquivo} className="guia-pagina">
                <Image
                  src={p.arquivo}
                  width={p.largura}
                  height={p.altura}
                  alt={t("pageAlt", { page: i + 1, total })}
                  quality={90}
                  /* a página do guia é LEITURA: no computador ela não passa de 880px, no celular ocupa
                     a largura toda menos o respiro lateral */
                  sizes="(min-width: 960px) 880px, calc(100vw - 32px)"
                  priority={i === 0}
                />
              </li>
            ))}
          </ol>

          <div className="container guia-fecho">
            <p className="corpo-grande">{pacotes("closing")}</p>
            <a href="#form" className="botao">
              {hero("cta")}
            </a>
          </div>
        </section>
      </main>
      <Footer caminhoIdioma={CAMINHO_DO_GUIA} />
      <MobileCta />
      <Espinha />
    </>
  );
}
