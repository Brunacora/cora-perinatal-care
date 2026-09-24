import "server-only";
import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import Markdoc, { type Node, type RenderableTreeNode, Tag } from "@markdoc/markdoc";
import keystaticConfig from "../../keystatic.config";
import { colarUltimasPalavrasEm } from "./tipografia";

/**
 * A LEITURA DO THE CORA JOURNAL. Os artigos vêm do painel (Keystatic), que grava arquivos em
 * `content/journal`. Tudo o que a página precisa sai daqui, já pronto: tempo de leitura, índice,
 * a pausa do meio encaixada e o acabamento tipográfico aplicado NA LEITURA (o arquivo do artigo fica
 * limpo, como a copy do site).
 */

const reader = createReader(process.cwd(), keystaticConfig);

export type Categoria =
  | "you-are-seen"
  | "what-no-one-told-you"
  | "behind-cora"
  | "brazilian-roots"
  | "where-to-start";

export type IdiomaArtigo = "en" | "pt";

export type Artigo = {
  slug: string;
  titulo: string;
  idioma: IdiomaArtigo;
  categoria: Categoria;
  resumo: string;
  chamada: string;
  fraseDaCapa: string;
  fotoDaCapa: string | null;
  descricaoDaFoto: string;
  temaDeSaude: boolean;
  publicado: string;
  atualizado: string;
  tituloGoogle: string;
  descricaoGoogle: string;
  minutos: number;
  /** Os textos de TELA, com as últimas palavras coladas (regra das órfãs). Título, metadados e
      dados estruturados usam os campos crus acima: espaço inflexível não vai para o Google. */
  tela: { titulo: string; resumo: string; chamada: string; frase: string };
};

export type Subtitulo = { id: string; texto: string };

/* Leitura calma, no celular, de madrugada: 200 palavras por minuto, nunca menos de 1. */
const PALAVRAS_POR_MINUTO = 200;

function textoDe(no: Node): string {
  let s = "";
  for (const filho of no.walk()) {
    if (filho.type === "text" && typeof filho.attributes.content === "string") {
      s += `${filho.attributes.content} `;
    }
  }
  return s;
}

function contarPalavras(no: Node): number {
  return textoDe(no).split(/\s+/).filter(Boolean).length;
}

type Entrada = Awaited<ReturnType<typeof reader.collections.artigos.all>>[number];

/* O Keystatic entrega o corpo como função (leitura preguiçosa) ou já resolvido, conforme a chamada. */
type Corpo = { node: Node } | (() => Promise<{ node: Node }>);
async function lerNo(corpo: Corpo): Promise<Node> {
  return (typeof corpo === "function" ? await corpo() : corpo).node;
}

async function montar({ slug, entry }: Entrada): Promise<Artigo> {
  const node = await lerNo(entry.corpo as Corpo);
  return {
    slug,
    titulo: entry.titulo,
    idioma: entry.idioma as IdiomaArtigo,
    categoria: entry.categoria as Categoria,
    resumo: entry.resumo,
    chamada: entry.chamada,
    fraseDaCapa: entry.fraseDaCapa,
    fotoDaCapa: entry.fotoDaCapa ?? null,
    descricaoDaFoto: entry.descricaoDaFoto,
    temaDeSaude: entry.temaDeSaude,
    publicado: entry.publicado ?? "",
    atualizado: entry.atualizado ?? entry.publicado ?? "",
    tituloGoogle: entry.tituloGoogle,
    descricaoGoogle: entry.descricaoGoogle,
    minutos: Math.max(1, Math.round(contarPalavras(node) / PALAVRAS_POR_MINUTO)),
    tela: {
      titulo: colarUltimasPalavrasEm(entry.titulo),
      resumo: colarUltimasPalavrasEm(entry.resumo),
      chamada: colarUltimasPalavrasEm(entry.chamada),
      frase: colarUltimasPalavrasEm(entry.fraseDaCapa || entry.titulo),
    },
  };
}

/** Todos os artigos, do mais novo para o mais antigo. */
export const todosOsArtigos = cache(async (): Promise<Artigo[]> => {
  const entradas = await reader.collections.artigos.all();
  const artigos = await Promise.all(entradas.map(montar));
  return artigos.sort((a, b) => b.publicado.localeCompare(a.publicado));
});

/** O artigo do "Start here". Se o painel apontar para um artigo que sumiu, cai no mais novo. */
export const artigoEmDestaque = cache(async (): Promise<Artigo | null> => {
  const artigos = await todosOsArtigos();
  const escolha = await reader.singletons.destaque.read();
  return artigos.find((a) => a.slug === escolha?.artigo) ?? artigos[0] ?? null;
});

/**
 * Três artigos para o "Keep reading": primeiro os da mesma categoria; quando o artigo é em
 * português, pelo menos um outro em português (roteiro, Parte 4); o resto, os mais novos.
 */
export function relacionados(atual: Artigo, todos: Artigo[]): Artigo[] {
  const outros = todos.filter((a) => a.slug !== atual.slug);
  const escolhidos: Artigo[] = [];
  const pegar = (a?: Artigo) => {
    if (a && !escolhidos.includes(a) && escolhidos.length < 3) escolhidos.push(a);
  };
  if (atual.idioma === "pt") pegar(outros.find((a) => a.idioma === "pt"));
  outros.filter((a) => a.categoria === atual.categoria).forEach(pegar);
  outros.forEach(pegar);
  return escolhidos;
}

/* ------------------------------------------------------------------------------------------- */
/* O corpo do artigo                                                                            */
/* ------------------------------------------------------------------------------------------- */

function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function textoDaTag(no: RenderableTreeNode): string {
  if (typeof no === "string") return no;
  if (Tag.isTag(no)) return no.children.map(textoDaTag).join("");
  return "";
}

/* No CORPO a letra é pequena e a coluna tem pelo menos 280px: o bloco colado pode chegar a 24
   caracteres (o teto de 18 do site é o dos títulos grandes). Medido em 2026-09-23: com 18,
   "without hesitation:" e "questions answered." ficavam de fora e fechavam a linha em 26%. */
const TETO_CORPO = 24;

/**
 * Cola as últimas palavras do último trecho de texto de um parágrafo ou item (regra das órfãs).
 * O último trecho pode ser curto, depois de um negrito ("**Pale.** or weak."): com duas palavras,
 * cola as duas; com três ou mais, a regra inteira do site.
 */
function colarParagrafo(tag: Tag) {
  for (let i = tag.children.length - 1; i >= 0; i--) {
    const filho = tag.children[i];
    if (typeof filho === "string") {
      if (!filho.trim()) continue;
      const palavras = filho.trim().split(/\s+/);
      if (palavras.length >= 3) tag.children[i] = colarUltimasPalavrasEm(filho, TETO_CORPO);
      else if (palavras.length === 2 && palavras.join(" ").length <= TETO_CORPO) {
        tag.children[i] = filho.replace(/(\S+)\s+(\S+\s*)$/, "$1\u00a0$2");
      }
      return;
    }
    if (Tag.isTag(filho)) {
      colarParagrafo(filho);
      return;
    }
  }
}

export type CorpoPronto = {
  arvore: RenderableTreeNode;
  subtitulos: Subtitulo[];
};

/**
 * Lê e prepara o corpo: dá um `id` estável a cada subtítulo (para o índice), cola as últimas
 * palavras de cada parágrafo e de cada item de lista, e encaixa a PAUSA DO MEIO antes do subtítulo
 * mais perto da metade do texto (ou, sem subtítulos, depois do parágrafo do meio). Assim a Bruna
 * nunca precisa lembrar de colocar o convite.
 */
export async function lerCorpo(slug: string): Promise<CorpoPronto | null> {
  const entrada = await reader.collections.artigos.read(slug);
  if (!entrada) return null;
  const node = await lerNo(entrada.corpo as Corpo);
  const raiz = Markdoc.transform(node) as Tag;
  /* o Markdoc embrulha tudo num <article>, e a página já é um <article>: a raiz vira <div> */
  raiz.name = "div";

  const subtitulos: Subtitulo[] = [];
  const usados = new Set<string>();
  const blocos = raiz.children;

  let caracteres = 0;
  const posicoes: number[] = [];
  blocos.forEach((bloco) => {
    posicoes.push(caracteres);
    caracteres += textoDaTag(bloco).length;
    if (!Tag.isTag(bloco)) return;
    if (bloco.name === "h2") {
      const texto = textoDaTag(bloco);
      let id = slugificar(texto) || "parte";
      while (usados.has(id)) id = `${id}-2`;
      usados.add(id);
      bloco.attributes = { ...bloco.attributes, id };
      /* o subtítulo e o item do índice também têm última linha: a mesma cola */
      colarParagrafo(bloco);
      subtitulos.push({ id, texto: colarUltimasPalavrasEm(texto, TETO_CORPO) });
    }
    if (bloco.name === "p") colarParagrafo(bloco);
    if (bloco.name === "ul" || bloco.name === "ol") {
      bloco.children.forEach((li) => Tag.isTag(li) && colarParagrafo(li));
    }
  });

  /* A pausa do meio: o h2 cujo começo fica mais perto de 50% do texto, desde que não seja o
     primeiro bloco nem esteja no último quinto (convite colado no fim vira o CTA do fim). */
  const metade = caracteres / 2;
  let alvo = -1;
  let melhor = Infinity;
  blocos.forEach((bloco, i) => {
    if (!Tag.isTag(bloco) || bloco.name !== "h2" || i === 0) return;
    if (posicoes[i] > caracteres * 0.8 || posicoes[i] < caracteres * 0.25) return;
    const distancia = Math.abs(posicoes[i] - metade);
    if (distancia < melhor) {
      melhor = distancia;
      alvo = i;
    }
  });
  if (alvo === -1) {
    alvo = posicoes.findIndex((p, i) => p >= metade && Tag.isTag(blocos[i]) && blocos[i].name === "p");
  }
  if (alvo > 0) blocos.splice(alvo, 0, new Tag("PausaDoMeio"));

  return { arvore: raiz, subtitulos };
}
