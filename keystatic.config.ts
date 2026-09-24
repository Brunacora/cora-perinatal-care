import { createElement } from "react";
import { collection, config, fields, singleton } from "@keystatic/core";
import { mark } from "@keystatic/core/content-components";

/**
 * O PAINEL DO THE CORA JOURNAL (Keystatic, aprovado pelo Gabriel em 2026-09-23).
 *
 * A Bruna escreve e edita os artigos em `/keystatic`, sem tocar em código. Os artigos são ARQUIVOS
 * no próprio repositório (`content/journal/*.mdoc`), então não existe banco nem fornecedor externo.
 *
 * ONDE O PAINEL GRAVA:
 * - sempre no repositório do GitHub: cada artigo salvo vira um commit, e a Vercel publica sozinha.
 *   No ar o painel só abre com as chaves do app do GitHub na Vercel (`src/lib/painel.ts`).
 *
 * Os rótulos estão em português de propósito: quem usa o painel é a Bruna.
 */

/* O REPOSITÓRIO fica escrito aqui, e não numa variável: esta configuração também roda no NAVEGADOR
   (o painel), e variável sem `NEXT_PUBLIC_` não chega lá. Medido em 2026-09-23: com a variável, o
   painel abria no modo "gravar no disco" mesmo com o repositório configurado. Quem decide se o painel
   ABRE no ar é `src/lib/painel.ts` (as chaves do app do GitHub). */
const REPOSITORIO = "uolivergab/cora-perinatal-care";

export const CATEGORIAS = [
  { label: "You are seen", value: "you-are-seen" },
  { label: "What no one told you", value: "what-no-one-told-you" },
  { label: "Behind Cora", value: "behind-cora" },
  { label: "Brazilian roots", value: "brazilian-roots" },
  { label: "Where to start", value: "where-to-start" },
] as const;

export default config({
  storage: { kind: "github", repo: REPOSITORIO },
  ui: {
    brand: { name: "The Cora Journal" },
  },
  collections: {
    artigos: collection({
      label: "Artigos",
      slugField: "titulo",
      path: "content/journal/*",
      format: { contentField: "corpo" },
      entryLayout: "content",
      columns: ["titulo", "categoria", "idioma", "atualizado"],
      schema: {
        titulo: fields.slug({
          name: {
            label: "Título",
            description: "O título do artigo, como aparece no site. Até duas linhas no card.",
            validation: { length: { min: 4, max: 90 } },
          },
          slug: {
            label: "Endereço",
            description:
              "Sempre em inglês, curto, sem acento, mesmo nos artigos em português. Ex.: newborn-sleep",
          },
        }),
        idioma: fields.select({
          label: "Idioma do artigo",
          description: "O idioma em que VOCÊ escreveu. Artigos em português ganham a etiqueta \"Em português\".",
          options: [
            { label: "Inglês", value: "en" },
            { label: "Português", value: "pt" },
          ],
          defaultValue: "en",
        }),
        categoria: fields.select({
          label: "Categoria",
          options: [...CATEGORIAS],
          defaultValue: "you-are-seen",
        }),
        resumo: fields.text({
          label: "Resumo de uma linha",
          description: "Aparece no card da grade. Uma frase curta, que diga para quem é o artigo.",
          validation: { length: { min: 10, max: 120 } },
        }),
        chamada: fields.text({
          label: "Resumo de duas linhas",
          description:
            "Aparece embaixo do título dentro do artigo e no destaque \"Start here\". Duas frases no máximo.",
          multiline: true,
          validation: { length: { min: 20, max: 240 } },
        }),
        fraseDaCapa: fields.text({
          label: "Frase da capa (opcional)",
          description:
            "A capa é desenhada sozinha com o título. Se quiser outra frase na capa, mais curta, escreva aqui.",
          validation: { length: { max: 70 } },
        }),
        fotoDaCapa: fields.image({
          label: "Foto da capa (opcional)",
          description:
            "Sem foto, a capa é tipográfica, na cor da categoria. Foto horizontal, luz natural. Nada de bebê sozinho nem hospital.",
          directory: "public/journal/capas",
          publicPath: "/journal/capas/",
        }),
        descricaoDaFoto: fields.text({
          label: "Descrição da foto (para leitores de tela)",
          description: "O que a foto mostra, em uma frase. Obrigatória quando há foto.",
        }),
        temaDeSaude: fields.checkbox({
          label: "Fala de saúde (sintoma, saúde mental, alimentação do bebê ou recuperação)",
          description:
            "Ligado, o artigo termina com o bloco de cuidado profissional e os telefones de apoio. Na dúvida, deixe ligado.",
          defaultValue: true,
        }),
        publicado: fields.date({
          label: "Data de publicação",
          description: "Não aparece no site. Fica no código, para o Google.",
          validation: { isRequired: true },
          defaultValue: { kind: "today" },
        }),
        atualizado: fields.date({
          label: "Última atualização",
          description: "Aparece no artigo como \"Updated March 2026\". Mude sempre que revisar o texto.",
          validation: { isRequired: true },
          defaultValue: { kind: "today" },
        }),
        tituloGoogle: fields.text({
          label: "Título para o Google (até 60 caracteres)",
          description: "Opcional. Sem ele, usamos o título do artigo.",
          validation: { length: { max: 60 } },
        }),
        descricaoGoogle: fields.text({
          label: "Descrição para o Google (até 155 caracteres)",
          description: "Opcional. Sem ela, usamos o resumo de duas linhas.",
          multiline: true,
          validation: { length: { max: 155 } },
        }),
        corpo: fields.markdoc({
          label: "Texto",
          description:
            "Use Título 2 para os subtítulos. O convite para a conversa entra sozinho no meio do texto.",
          options: {
            image: false,
            table: false,
            codeBlock: false,
            code: false,
            divider: true,
            heading: [2, 3],
          },
          components: {
            /* O SUBLINHADO À MÃO (2026-09-24): selecione uma frase e marque. No site, um traço de
               tinta ondulado se desenha embaixo dela enquanto a leitora passa. Uma frase por artigo
               basta; mais que duas e ele deixa de ser gesto. */
            sublinhado: mark({
              label: "Sublinhar à mão",
              icon: createElement("span", { style: { textDecoration: "underline wavy" } }, "S"),
              schema: {},
              tag: "span",
              className: "sublinhado",
            }),
          },
        }),
      },
    }),
  },
  singletons: {
    destaque: singleton({
      label: "Start here (artigo em destaque)",
      path: "content/destaque",
      schema: {
        artigo: fields.relationship({
          label: "Artigo em destaque",
          description: "Aparece no topo do journal. Troque a cada quinze ou trinta dias.",
          collection: "artigos",
          validation: { isRequired: true },
        }),
      },
    }),
  },
});
