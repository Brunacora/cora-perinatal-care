import React from "react";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import { Sublinhado } from "./Sublinhado";

/**
 * O corpo do artigo, desenhado a partir do que a Bruna escreveu no painel. A árvore já chega pronta
 * de `lib/journal.ts` (ids nos subtítulos, órfãs coladas, a pausa do meio encaixada).
 *
 * A PAUSA DO MEIO (design-blog.md, 5.6): um card da largura da coluna, sem borda, que parece uma
 * pausa dentro do texto e não um anúncio. Copy verbatim do roteiro do blog.
 *
 * O SUBLINHADO À MÃO: a frase que a Bruna marcou no painel (`Sublinhado.tsx`).
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
        {/* o arco da marca, que se DESENHA quando a pausa chega (--pausa-traco, escrito pela rolagem) */}
        <svg className="pausa-arco" viewBox="0 0 22 28" aria-hidden="true">
          <path d="M1.5 27.5 V11 A9.5 9.5 0 0 1 20.5 11 V27.5" pathLength={1} />
        </svg>
        <p className="pausa-texto">{pausa.texto}</p>
        <a href="#form" className="botao">
          {pausa.botao}
        </a>
      </aside>
    );
  }
  return <div className="prosa">{Markdoc.renderers.react(arvore, React, { components: { PausaDoMeio, Sublinhado } })}</div>;
}
