import { CAMPOS, legivel, type Campo, type ChaveCampo, type Pedido } from "./formulario";
import { CONTATO } from "./contato";
import en from "../../messages/en.json";
import pt from "../../messages/pt.json";

/**
 * OS DOIS E-MAILS DO FORMULÁRIO (skill `sistema-de-formulario`, references/html-de-email.md).
 *
 * Cliente de e-mail não é navegador. As regras daqui não são preferência de estilo: layout só com
 * <table>; todo estilo INLINE (o Gmail remove <style>); zero webfont (Georgia para leitura, Arial
 * para rótulo); zero imagem, e o wordmark é TEXTO (o Outlook bloqueia imagem, e o e-mail chegaria
 * decapitado); cor de fundo no <td> com `bgcolor` E `style`; tabela FLUIDA com width="100%" e
 * max-width, nunca largura fixa (a 375px o Gmail encolheria a mensagem inteira); versão em texto
 * puro junto; e escape em 100% do que o lead digitou.
 *
 * Os dois e-mails têm critérios OPOSTOS:
 * - para a Bruna, velocidade de leitura: os campos de decisão (data, serviço, lugar, contato)
 *   sobem para o topo e não se repetem embaixo; o assunto traz o que ela confere primeiro; sem
 *   rodapé de marca, porque é interno. Em português, que é a língua dela.
 * - para o lead, marca: papel, wordmark em texto, filete de tinta, SÓ copy que já existe no
 *   roteiro (nada de saudação ou despedida inventada), a cópia do que a pessoa enviou e o rodapé
 *   com domínio e Instagram lidos de `contato.ts`.
 *
 * CONTRASTE: papel sobre a terracota mede 3,96:1, abaixo da régua de corpo de texto. Por isso a
 * faixa escura dos dois e-mails é o barro (13,7:1), e a terracota aparece só no wordmark (texto
 * grande) e no filete.
 *
 * A prova renderizada, obrigatória antes de aprovar e com uma coluna a 375px, sai do código real
 * daqui: `/api/prova-emails`, que só existe em desenvolvimento.
 */

export type Email = { assunto: string; html: string; texto: string };

/* a paleta do design.md em hex, porque e-mail não lê variável de CSS */
const COR = {
  papel: "#FDF5DE",
  papel2: "#F7ECD2",
  tinta: "#D44D1B",
  barro: "#3B2015",
  barro70: "#6B4A3C",
  linha: "#E9C9A8",
} as const;

const SERIFADA = "Georgia,'Times New Roman',serif";
const SEM_SERIFA = "Arial,Helvetica,sans-serif";

/** escape de 100% do que vem de fora: &, <, >, " e ' */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** as áreas de texto: escapa e preserva a quebra de linha que a pessoa digitou */
const comQuebras = (texto: string) => escapar(texto).replace(/\r?\n/g, "<br>");
/** assunto não aceita quebra de linha */
const umaLinha = (texto: string) => texto.replace(/\s*[\r\n]+\s*/g, " ").trim();
const soTelefone = (tel: string) => tel.replace(/[^\d+]/g, "");
const campoDe = (chave: ChaveCampo) => (CAMPOS as readonly Campo[]).find((c) => c.chave === chave) as Campo;

const par = (estilo: string, conteudo: string) => `<p style="margin:0;${estilo}">${conteudo}</p>`;

function celula(fundo: string, cor: string, padding: string, conteudo: string): string {
  return `<tr><td bgcolor="${fundo}" style="background-color:${fundo};color:${cor};padding:${padding};">${conteudo}</td></tr>`;
}

function espaco(fundo: string, altura: number): string {
  return `<tr><td height="${altura}" bgcolor="${fundo}" style="background-color:${fundo};height:${altura}px;line-height:${altura}px;font-size:0;">&nbsp;</td></tr>`;
}

/** filete: tabelinha própria, porque borda em <td> vazio some no Outlook */
function filete(cor: string, largura?: number): string {
  const w = largura ? `width="${largura}"` : 'width="100%"';
  const estilo = largura ? `width:${largura}px;` : "width:100%;";
  const altura = largura ? 2 : 1;
  return `<table role="presentation" ${w} cellpadding="0" cellspacing="0" border="0" style="${estilo}border-collapse:collapse;"><tr><td height="${altura}" bgcolor="${cor}" style="background-color:${cor};height:${altura}px;line-height:${altura}px;font-size:0;">&nbsp;</td></tr></table>`;
}

/** o bloco central: fluido, com teto de largura, nunca largura fixa */
function bloco(linhas: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;border-collapse:collapse;">\n${linhas.join("\n")}\n</table>`;
}

/** o esqueleto: fundo declarado no body E na tabela, modo claro travado */
function documento(lang: string, titulo: string, preheader: string, fundo: string, conteudo: string): string {
  return [
    "<!doctype html>",
    `<html lang="${lang}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light only">',
    '<meta name="supported-color-schemes" content="light">',
    `<title>${escapar(titulo)}</title>`,
    "</head>",
    `<body style="margin:0;padding:0;background-color:${fundo};">`,
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapar(preheader)}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${fundo}" style="width:100%;background-color:${fundo};border-collapse:collapse;">`,
    '<tr><td align="center" style="padding:24px 12px;">',
    conteudo,
    "</td></tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("\n");
}

/* ------------------------------------------------------------------------------------------ */
/* Para a Bruna: velocidade de leitura                                                         */
/* ------------------------------------------------------------------------------------------ */

const PROMOVIDOS: readonly ChaveCampo[] = ["name", "phone", "email", "contact", "location", "date", "services"];

export function emailParaBruna(pedido: Pedido): Email {
  const servico = pedido.services ? legivel(campoDe("services"), pedido.services) : "";
  const contato = legivel(campoDe("contact"), pedido.contact || "email").toLowerCase();
  const decisao = [pedido.date, servico, pedido.location].filter(Boolean);
  const resto = (CAMPOS as readonly Campo[]).filter((c) => {
    const chave = c.chave as ChaveCampo;
    return !PROMOVIDOS.includes(chave) && pedido[chave];
  });

  /* o assunto começa pelo que ela confere primeiro: a data do bebê, depois o nome */
  const assunto = umaLinha(["Pedido", pedido.date, pedido.name].filter(Boolean).join(" · "));

  const link = (href: string, texto: string) =>
    `<a href="${escapar(href)}" style="color:${COR.barro};text-decoration:underline;">${escapar(texto)}</a>`;
  const meios = [
    pedido.phone ? link(`tel:${soTelefone(pedido.phone)}`, pedido.phone) : "",
    link(`mailto:${pedido.email}`, pedido.email),
  ].filter(Boolean);

  const linhas = [
    celula(
      COR.barro,
      COR.papel,
      "12px 24px",
      par(
        `font-family:${SEM_SERIFA};font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${COR.papel};`,
        "Novo pedido &middot; site",
      ),
    ),
    celula(
      COR.papel,
      COR.barro,
      "28px 24px 0 24px",
      par(`font-family:${SERIFADA};font-size:28px;line-height:34px;color:${COR.barro};`, escapar(pedido.name)) +
        (decisao.length
          ? par(
              `margin-top:8px;font-family:${SEM_SERIFA};font-size:15px;line-height:22px;color:${COR.barro};`,
              decisao.map(escapar).join(" &middot; "),
            )
          : ""),
    ),
    celula(
      COR.papel,
      COR.barro,
      "16px 24px 24px 24px",
      par(
        `font-family:${SEM_SERIFA};font-size:14px;line-height:22px;color:${COR.barro70};`,
        `Contato preferido: <strong style="color:${COR.barro};">${escapar(contato)}</strong>`,
      ) +
        par(
          `margin-top:4px;font-family:${SEM_SERIFA};font-size:15px;line-height:24px;color:${COR.barro};`,
          meios.join(" &middot; "),
        ),
    ),
    celula(COR.papel, COR.barro, "0 24px", filete(COR.linha)),
    ...resto.map((c) =>
      celula(
        COR.papel,
        COR.barro,
        "20px 24px 0 24px",
        par(
          `font-family:${SEM_SERIFA};font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:${COR.barro70};`,
          escapar(c.coluna),
        ) +
          par(
            `margin-top:4px;font-family:${SERIFADA};font-size:16px;line-height:24px;color:${COR.barro};`,
            comQuebras(pedido[c.chave as ChaveCampo]),
          ),
      ),
    ),
    celula(
      COR.papel,
      COR.barro,
      "28px 24px",
      par(
        `font-family:${SEM_SERIFA};font-size:13px;line-height:20px;color:${COR.barro70};`,
        `Para responder, é só responder este e-mail: a resposta vai direto para ${escapar(pedido.email)}.`,
      ),
    ),
  ];

  const texto: string[] = ["NOVO PEDIDO · SITE", "", pedido.name];
  if (decisao.length) texto.push(decisao.join(" · "));
  texto.push(`Contato preferido: ${contato}`);
  if (pedido.phone) texto.push(`Telefone: ${pedido.phone}`);
  texto.push(`Email: ${pedido.email}`);
  for (const c of resto) texto.push("", c.coluna.toUpperCase(), pedido[c.chave as ChaveCampo]);
  texto.push("", `Para responder, é só responder este e-mail: a resposta vai direto para ${pedido.email}.`);

  return {
    assunto,
    html: documento("pt-BR", assunto, decisao.join(" · ") || pedido.email, COR.papel2, bloco(linhas)),
    texto: texto.join("\n"),
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Para o lead: marca, e só a copy que já existe                                               */
/* ------------------------------------------------------------------------------------------ */

export function emailParaLead(pedido: Pedido, locale: "en" | "pt"): Email {
  const m = (locale === "pt" ? pt : en).footer;
  const perguntas = m.fields as unknown as Record<string, string>;
  const opcoesServico = m.fields.servicesOptions as Record<string, string>;

  const resposta = (chave: ChaveCampo): string => {
    const v = pedido[chave];
    if (!v) return "";
    if (chave === "contact") return v === "phone" ? m.fields.contactPhone : m.fields.contactEmail;
    if (chave === "services") return opcoesServico[v] ?? v;
    return v;
  };
  const respondidos = (CAMPOS as readonly Campo[])
    .map((c) => c.chave as ChaveCampo)
    .filter((chave) => resposta(chave));

  const assunto = umaLinha(m.title);
  const [primeira, ...demais] = CONTATO.marca.split(" ");
  const linkPapel = (href: string, texto: string) =>
    `<a href="${escapar(href)}" style="color:${COR.papel};text-decoration:underline;">${escapar(texto)}</a>`;

  const linhas = [
    /* o wordmark em texto: "Cora" grande em tinta (texto grande, passa na régua), o resto pequeno */
    celula(
      COR.papel,
      COR.barro,
      "36px 28px 0 28px",
      par(
        `font-family:${SERIFADA};font-size:30px;line-height:36px;letter-spacing:8px;text-transform:uppercase;color:${COR.tinta};`,
        escapar(primeira),
      ) +
        par(
          `margin-top:6px;font-family:${SEM_SERIFA};font-size:11px;line-height:14px;letter-spacing:4px;text-transform:uppercase;color:${COR.barro70};`,
          escapar(demais.join(" ")),
        ),
    ),
    celula(COR.papel, COR.barro, "20px 28px 0 28px", filete(COR.tinta, 48)),
    celula(
      COR.papel,
      COR.barro,
      "28px 28px 0 28px",
      par(`font-family:${SERIFADA};font-size:26px;line-height:32px;color:${COR.barro};`, escapar(m.title)) +
        par(`margin-top:16px;font-family:${SERIFADA};font-size:17px;line-height:27px;color:${COR.barro};`, escapar(m.text)),
    ),
    celula(COR.papel, COR.barro, "32px 28px 0 28px", filete(COR.linha)),
    celula(
      COR.papel,
      COR.barro,
      "24px 28px 0 28px",
      par(
        `font-family:${SEM_SERIFA};font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${COR.barro70};`,
        escapar(m.form.emailCopy),
      ),
    ),
    ...respondidos.map((chave) =>
      celula(
        COR.papel,
        COR.barro,
        "16px 28px 0 28px",
        par(`font-family:${SEM_SERIFA};font-size:13px;line-height:19px;color:${COR.barro70};`, escapar(perguntas[chave] ?? "")) +
          par(`margin-top:4px;font-family:${SERIFADA};font-size:16px;line-height:24px;color:${COR.barro};`, comQuebras(resposta(chave))),
      ),
    ),
    espaco(COR.papel, 36),
    celula(
      COR.barro,
      COR.papel,
      "28px 28px 32px 28px",
      par(`font-family:${SEM_SERIFA};font-size:13px;line-height:20px;color:${COR.papel};`, escapar(m.contact.person)) +
        par(`margin-top:6px;font-family:${SERIFADA};font-size:16px;line-height:22px;color:${COR.papel};`, escapar(CONTATO.marca)) +
        par(`margin-top:2px;font-family:${SEM_SERIFA};font-size:13px;line-height:20px;color:${COR.papel};`, escapar(m.contact.area)) +
        par(
          `margin-top:16px;font-family:${SEM_SERIFA};font-size:13px;line-height:22px;color:${COR.papel};`,
          `${linkPapel(CONTATO.site, CONTATO.dominio)} &middot; ${linkPapel(CONTATO.instagramUrl, CONTATO.instagram)}`,
        ) +
        par(
          `margin-top:2px;font-family:${SEM_SERIFA};font-size:13px;line-height:22px;color:${COR.papel};`,
          `${escapar(m.contact.email)} &middot; ${escapar(m.contact.phone)}`,
        ),
    ),
  ];

  const texto: string[] = [CONTATO.marca.toUpperCase(), "", m.title, "", m.text, "", m.form.emailCopy.toUpperCase()];
  for (const chave of respondidos) texto.push("", perguntas[chave] ?? "", resposta(chave));
  texto.push(
    "",
    "",
    m.contact.person,
    CONTATO.marca,
    m.contact.area,
    `${CONTATO.dominio} · ${CONTATO.instagram}`,
    `${m.contact.email} · ${m.contact.phone}`,
  );

  return {
    assunto,
    html: documento(locale === "pt" ? "pt-BR" : "en", assunto, m.text, COR.papel2, bloco(linhas)),
    texto: texto.join("\n"),
  };
}
