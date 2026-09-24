import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { IDIOMAS_PUBLICADOS, routing } from "@/i18n/routing";
import { SITE_HOST, SITE_URL, etiquetaDoIdioma, idiomaDoConteudo, localePath } from "@/lib/site";
import { schemaToJson, siteSchema } from "@/lib/schema";
import { MovimentoProvider } from "@/components/MovimentoProvider";
import "../globals.css";

const FONTES =
  "https://api.fontshare.com/v2/css?f[]=gambetta@400,401,500,501&f[]=general-sans@400,401,500,501&display=swap";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * O cartão do link compartilhado (WhatsApp, iMessage, redes): o jardim da marca com o logo, sem
 * texto, porque o título e a descrição já vêm escritos ao lado. JPEG e não WebP: o WhatsApp não
 * mostra WebP em preview de link (medido no site da Carina).
 */
const CARTAO = { url: "/og.jpg", type: "image/jpeg", width: 1200, height: 630 };

/**
 * METADADOS (skill `seo-e-medicao`). Todo endereço é relativo e se completa pelo `metadataBase`,
 * que vem de `lib/site.ts`: nenhuma URL escrita à mão. A página se descreve no idioma do CONTEÚDO
 * que serve (ver `idiomaDoConteudo`), e o hreflang só existe quando há mais de um idioma de
 * verdade, sempre com o `x-default`, que diz para onde mandar quem não bate com nenhum deles.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const idioma = idiomaDoConteudo(locale);
  const t = await getTranslations({ locale: idioma, namespace: "meta" });
  const titulo = t("title");
  const descricao = t("description");
  const marca = t("siteName");
  const canonica = localePath(idioma);
  const versoes =
    IDIOMAS_PUBLICADOS.length > 1
      ? {
          ...Object.fromEntries(IDIOMAS_PUBLICADOS.map((l) => [l, localePath(l)])),
          "x-default": localePath(routing.defaultLocale),
        }
      : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: titulo,
    description: descricao,
    alternates: { canonical: canonica, ...(versoes ? { languages: versoes } : {}) },
    openGraph: {
      type: "website",
      siteName: marca,
      locale: idioma === "pt" ? "pt_BR" : "en_US",
      url: canonica,
      title: titulo,
      description: descricao,
      images: [{ ...CARTAO, alt: marca }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: [CARTAO.url],
    },
    /* O símbolo sobre o papel da marca, e não o SVG transparente: ele é traço escuro e sumia na
       barra de abas do modo escuro. O `favicon.ico` (16, 32 e 48px) vem por convenção de arquivo
       em `src/app`; o de 192px atende a recomendação do Google (múltiplo de 48). */
    icons: {
      icon: [{ url: "/logo/cora-icone-192.png", type: "image/png", sizes: "192x192" }],
      apple: "/logo/cora-simbolo-180.png",
    },
  };
}

export const viewport = {
  themeColor: "#fdf5de",
  /* O MESMO `only light` do `globals.css`, aqui como META. Ela chega no `<head>` ANTES de a folha de
     estilo ser lida, e é nesse instante que o navegador de celular decide se vai escurecer a página
     à força. Declarar nos dois lugares é de propósito, não repetição à toa. */
  colorScheme: "only light" as const,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

/**
 * Id do site no Umami, a estatística SEM COOKIE que o briefing escolheu (Modo A: banner de
 * consentimento mataria o primeiro segundo). Sem a variável não existe script: o `npm run dev` não
 * polui a estatística, e o site nunca serve um id vazio. Com o domínio oficial definido, o script só
 * conta visitas nele (`data-domains`), e os previews da Vercel ficam de fora.
 */
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={etiquetaDoIdioma(locale)}
      /* o abajur do journal acende `data-luz` no <html> antes de o React hidratar (sem clarão para
         quem lê de madrugada); só esse atributo difere, e é de propósito */
      suppressHydrationWarning
    >
      <head>
        {/* AS FONTES VÊM DA FONTSHARE (2026-09-24). A licença delas (ITF Free Font License) deixa usar
            no site mas proíbe redistribuir os arquivos, e o repositório passou a ser público: os
            arquivos saíram dele. A conexão abre cedo; as métricas de reserva estão no globals.css. */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTES} />
        {/* DADOS ESTRUTURADOS, montados no SERVIDOR e servidos no HTML da primeira resposta: robô
            que não executa JavaScript (boa parte dos rastreadores de IA) precisa ver o grafo no
            HTML cru. Ver `lib/schema.ts`. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToJson(siteSchema(locale)) }}
        />
        {UMAMI_ID ? (
          <Script
            defer
            strategy="afterInteractive"
            src="https://cloud.umami.is/script.js"
            data-website-id={UMAMI_ID}
            {...(SITE_HOST ? { "data-domains": SITE_HOST } : {})}
          />
        ) : null}
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MovimentoProvider>{children}</MovimentoProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
