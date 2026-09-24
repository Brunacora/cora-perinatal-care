import en from "../../messages/en.json";
import pt from "../../messages/pt.json";
import { SITE_URL, absoluteUrl, idiomaDoConteudo, localePath } from "@/lib/site";

/**
 * DADOS ESTRUTURADOS (JSON-LD): o que o site diz em prosa, dito em linguagem de máquina (skill
 * `seo-e-medicao`; o grafo segue o que já roda no site da Carina).
 *
 * FONTE ÚNICA. Nome da marca, telefone, e-mail, Instagram, descrição e FAQ saem das MENSAGENS, a
 * mesma copy que a página mostra; o endereço sai de `lib/site.ts`. Nada escrito à mão aqui:
 * divergência entre o que a página diz e o que o grafo afirma é o que faz a máquina hesitar em dizer
 * quem a Bruna é. As mensagens entram CRUAS, direto do JSON, sem o espaço inflexível que a
 * apresentação cola nas órfãs.
 *
 * O MESMO `@id` NOS DOIS IDIOMAS: o negócio e a Bruna são as mesmas entidades descritas em duas
 * línguas, não quatro entidades.
 *
 * PROIBIDO, e fica escrito para ninguém "melhorar" depois: `aggregateRating` com depoimento do
 * próprio site. É regra explícita do Google: não ganha estrela e abre risco de ação manual. As
 * avaliações que contam vivem no Perfil da Empresa no Google, e é o `sameAs` que aponta para fora.
 */

const MENSAGENS = { en, pt } as const;

/** `inLanguage` pede a etiqueta completa, não só o idioma. */
const IDIOMA_BCP47 = { en: "en-US", pt: "pt-BR" } as const;

/**
 * O nome civil dela, separado do lockup do rodapé ("Bruna Gomes, CPD, Educator, ..."). O cargo sai
 * desse mesmo lockup, cortado depois do nome, e só quando ele começa pelo nome: se a copy mudar de
 * forma, o cargo some do grafo em vez de sair truncado.
 */
const NOME = "Bruna Gomes";

/**
 * As línguas em que ela ATENDE (briefing.md), declaradas à parte das línguas do site: é o
 * diferencial que quase nenhum concorrente declara, e a frente 1 de busca deste projeto
 * (pendencias-cora.md, Passe 4).
 */
const IDIOMAS_FALADOS = ["en", "pt"];

/**
 * Onde ela atende em pessoa: os dois estados da linha do rodapé ("Serving families in MA and NH")
 * e Boston, que a resposta do FAQ sobre área nomeia. O atendimento virtual não entra: não tem
 * lugar.
 */
const AREA_ATENDIDA = [
  { "@type": "City", name: "Boston" },
  { "@type": "State", name: "Massachusetts" },
  { "@type": "State", name: "New Hampshire" },
];

/** O retrato dela na história e o símbolo da marca em PNG (logo em grafo pede imagem rasterizada). */
const RETRATO = "/fotos/bruna-retrato-externo-02.jpg";
const SIMBOLO = "/logo/cora-simbolo-512.png";

/** Tipagem frouxa de propósito: o valor é JSON, não um modelo do domínio. */
type No = Record<string, unknown>;

/**
 * O grafo inteiro da página, no idioma do conteúdo dela. Um `@graph` só, com os nós ligados por
 * `@id`: é o que permite dizer "a Bruna trabalha PARA este negócio" sem repetir o negócio dentro
 * da pessoa.
 */
export function siteSchema(locale: string): No {
  const idioma = idiomaDoConteudo(locale);
  const m = MENSAGENS[idioma];
  const contato = m.footer.contact;
  const url = absoluteUrl(localePath(idioma));
  const idNegocio = `${SITE_URL}/#negocio`;
  const idBruna = `${SITE_URL}/#bruna`;
  const cargo = contato.person.startsWith(`${NOME}, `)
    ? contato.person.slice(NOME.length + 2)
    : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url,
        name: m.meta.siteName,
        inLanguage: IDIOMA_BCP47[idioma],
        publisher: { "@id": idNegocio },
      },
      {
        /* Não existe tipo de doula no schema.org, e os subtipos vizinhos mentiriam:
           `MedicalBusiness` afirmaria atendimento médico, que doula não faz, e
           `ProfessionalService` foi descontinuado. `LocalBusiness` é o honesto, e é o que o Google
           pede quando nenhum subtipo serve. */
        "@type": "LocalBusiness",
        "@id": idNegocio,
        name: m.meta.siteName,
        url,
        description: m.meta.description,
        image: absoluteUrl(RETRATO),
        logo: absoluteUrl(SIMBOLO),
        telephone: contato.phoneNumber,
        email: contato.emailAddress,
        areaServed: AREA_ATENDIDA,
        knowsLanguage: IDIOMAS_FALADOS,
        founder: { "@id": idBruna },
        sameAs: [contato.instagramUrl],
      },
      {
        /* Pessoa e negócio são entidades diferentes, ligadas por `worksFor`: sem as duas, a
           máquina não sabe se o nome é de gente ou de empresa. */
        "@type": "Person",
        "@id": idBruna,
        name: NOME,
        ...(cargo ? { jobTitle: cargo } : {}),
        image: absoluteUrl(RETRATO),
        url,
        worksFor: { "@id": idNegocio },
        knowsLanguage: IDIOMAS_FALADOS,
      },
    ],
  };
}

/**
 * O FAQ vai só na HOME, que é a página que o mostra. Com o journal (2026-09-23), o grafo do layout
 * passou a valer para páginas sem FAQ nenhum, e marcar pergunta e resposta que a página não mostra é
 * dado estruturado enganoso para o Google. Por isso o FAQ saiu do `siteSchema` e é chamado pela home.
 */
export function faqSchema(locale: string): No {
  const idioma = idiomaDoConteudo(locale);
  const m = MENSAGENS[idioma];
  /* O FAQ VERBATIM, o mesmo que a página mostra: o do roteiro.md no inglês, e no português a
     tradução do pt.json, que a Bruna revisa antes do domínio oficial. Aqui não se reescreve nem se
     resume. Perinatal é saúde, e informação reescrita no site de uma profissional certificada é
     exposição dela. Desde 2023 o Google só mostra o FAQ como resultado rico para sites de governo e
     de saúde de referência; o motivo de marcar é outro: é assim que os motores de IA leem pergunta e
     resposta como fato citável. */
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: IDIOMA_BCP47[idioma],
    mainEntity: m.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Serializa para o `<script>`, com `<` escapado: um `</script` dentro de qualquer texto da copy
 * fecharia a tag no meio do bloco e o resto do grafo viraria HTML solto na página.
 */
export function schemaToJson(schema: No): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
