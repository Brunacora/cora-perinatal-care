import React from "react";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";

/**
 * O corpo do artigo, desenhado a partir do que a Bruna escreveu no painel. A árvore já chega pronta
 * de `lib/journal.ts` (ids nos subtítulos, órfãs coladas, a pausa do meio encaixada).
 *
 * A PAUSA DO MEIO (design-blog.md, 5.6): um card da largura da coluna, sem borda, que parece uma
 * pausa dentro do texto e não um anúncio. Copy verbatim do roteiro do blog.
 */
export function CorpoArtigo({
  arvore,
  pausa,
}: {
  arvore: RenderableTreeNode;
  pausa: { texto: string; botao: string };
}) {
  function PausaDoMeio() {
    return (
      <aside className="pausa-do-meio" aria-label={pausa.botao}>
        <p className="pausa-texto">{pausa.texto}</p>
        <a href="#form" className="botao">
          {pausa.botao}
        </a>
      </aside>
    );
  }
  return <div className="prosa">{Markdoc.renderers.react(arvore, React, { components: { PausaDoMeio } })}</div>;
}
