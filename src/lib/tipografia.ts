// Acabamento tipográfico sistêmico (CLAUDE.md, Priority 6; skill acabamento-tipografico).
// Nunca manual e nunca gravado na copy: a transformação acontece na LEITURA, uma vez, no
// carregamento das mensagens (i18n/request.ts). Os arquivos de copy continuam limpos.

const NBSP = " ";

/* O bloco colado nunca passa disto: um pedaço indivisível largo estoura a coluna de 320px. */
const TETO = 18;

/* ITEM DE LISTA é letra de corpo, e na mesma coluna de 320px cabe um bloco maior que no tamanho de
   título. Medido em 2026-09-11: "(Hands-on practice)" tem 19 caracteres, ficava sem colar, e a
   1024px "practice)" fechava sozinho a última linha do item. */
const TETO_ITEM = 22;
const LISTAS = new Set(["bullets", "benefits"]);

/* Namespaces que não quebram linha na tela: o título e a descrição da página (lidos pelo buscador e
   pelas redes) e o texto alternativo das fotos (lido pelo leitor de tela). Nenhum espaço
   inflexível entra neles. */
const FORA = new Set(["meta", "alt"]);

/**
 * Cola as últimas palavras de UM parágrafo com espaço inflexível, para nenhuma palavra ficar
 * sozinha na última linha. Cola duas, e cola a TERCEIRA quando as três ainda cabem no teto.
 * MEDIDO em 2026-09-11, no formulário a 390px: colando só duas, "right now?" fechava a última
 * linha em 26% da largura e "help with?" em 21%; duas palavras curtas ainda deixam a linha
 * raquítica.
 * Só age com três palavras ou mais (rótulo curto não tem última linha), e não cola nada quando
 * as duas últimas já passam do teto.
 */
function colarParagrafo(p: string, teto: number): string {
  /* palavras nos índices pares, espaços nos ímpares */
  const pedacos = p.split(/( +)/);
  const palavras = pedacos.map((s, i) => (i % 2 === 0 && s !== "" ? i : -1)).filter((i) => i >= 0);
  if (palavras.length < 3) return p;
  const [a, b, c] = palavras.slice(-3);
  const duas = `${pedacos[b]} ${pedacos[c]}`;
  if (duas.length > teto) return p;
  pedacos[c - 1] = NBSP;
  if (palavras.length >= 4 && `${pedacos[a]} ${duas}`.length <= teto) pedacos[b - 1] = NBSP;
  return pedacos.join("");
}

/**
 * Aplica a colagem a um texto, parágrafo por parágrafo (cada linha tem a sua última linha).
 * Texto com interpolação ("Thank you, {name}.") fica como está: o valor só chega depois, e o
 * mesmo texto vai para leitor de tela e e-mail.
 */
export function colarUltimasPalavrasEm(texto: string, teto = TETO): string {
  if (/\{[^}]*\}/.test(texto)) return texto;
  return texto
    .split("\n")
    .map((p) => colarParagrafo(p, teto))
    .join("\n");
}

type Mensagens = { [chave: string]: string | Mensagens | Array<string | Mensagens> };

/** Aplica a colagem em toda a árvore de mensagens, uma vez, no carregamento. */
export function colarUltimasPalavras<T>(mensagens: T, raiz = true, teto = TETO): T {
  if (typeof mensagens === "string") {
    return colarUltimasPalavrasEm(mensagens, teto) as unknown as T;
  }
  if (Array.isArray(mensagens)) {
    return mensagens.map((m) => colarUltimasPalavras(m, false, teto)) as unknown as T;
  }
  if (mensagens && typeof mensagens === "object") {
    const saida: Mensagens = {};
    for (const [k, v] of Object.entries(mensagens as Mensagens)) {
      saida[k] =
        raiz && FORA.has(k) ? v : colarUltimasPalavras(v, false, LISTAS.has(k) ? TETO_ITEM : teto);
    }
    return saida as unknown as T;
  }
  return mensagens;
}
