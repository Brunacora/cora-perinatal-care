import { Fragment, type ReactNode } from "react";

/**
 * A palavra em itálico (design.md, seção 4). Apresentação, não copy: a mensagem
 * fica limpa no arquivo e a ênfase é decidida aqui, pela primeira ocorrência da
 * palavra inteira. Se a palavra não existir no texto, nada muda.
 *
 * A PALAVRA COMPOSTA NÃO SE PARTE NO HÍFEN. Num título grande, "pós-parto" quebrado em "pós-" e
 * "parto" desmonta a composição (o Gabriel viu na hero em português, 2026-09-11). O navegador
 * quebra depois de todo hífen e nenhuma propriedade de CSS impede (`hyphens: none` não muda nada,
 * medido); o hífen inseparável (U+2011) não existe na Gambetta nem na General Sans (medido: cai na
 * fonte de reserva). Por isso a palavra composta vai inteira num trecho sem quebra, e o texto
 * continua o mesmo, com o hífen de sempre.
 */
export function Enfase({ texto, palavra }: { texto: string; palavra: string }) {
  const re = new RegExp(`(^|[\\s"(])(${escapar(palavra)})(?=[\\s.,;:!?")]|$)`);
  const m = texto.match(re);
  if (!m || m.index === undefined) return <>{inteiras(texto)}</>;
  const inicio = m.index + m[1].length;
  const fim = inicio + m[2].length;
  return (
    <Fragment>
      {inteiras(texto.slice(0, inicio))}
      <em className="enfase">{texto.slice(inicio, fim)}</em>
      {inteiras(texto.slice(fim))}
    </Fragment>
  );
}

/**
 * Um título sem palavra em itálico, com a mesma proteção: nenhuma palavra composta se parte no
 * hífen. Serve aos títulos grandes que não passam pelo Enfase (o rodapé, as cenas, as perguntas do
 * FAQ). Medido em 2026-09-11: o título do rodapé partia "pós-" e "parto" a 1024px.
 */
export function Inteiras({ texto }: { texto: string }) {
  return <>{inteiras(texto)}</>;
}

/* letra, hífen, letra: a marca de uma palavra composta (com os acentos do português) */
const COMPOSTA = /[A-Za-zÀ-ÖØ-öø-ÿ]-[A-Za-zÀ-ÖØ-öø-ÿ]/;

/**
 * Cada trecho entre espaços que tem palavra composta ("pós-parto", "recém-nascido") vira um trecho
 * que não quebra. O trecho vai até o espaço COMUM, então leva junto as palavras que o espaço
 * inflexível já colou a ela ("pós-parto sozinha."): medido a 1024px, com só a palavra composta
 * embrulhada, o corte de linhas do SplitText separava "sozinha." dela e a palavra ficava solta na
 * última linha do título do rodapé.
 */
function inteiras(texto: string): ReactNode {
  const partes = texto.split(/( +)/);
  if (!partes.some((p) => COMPOSTA.test(p))) return texto;
  return partes.map((p, i) =>
    COMPOSTA.test(p) ? (
      <span key={i} className="sem-quebra">
        {p}
      </span>
    ) : (
      p
    ),
  );
}

function escapar(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
