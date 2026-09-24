"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O SÍMBOLO EM VOLUME (3D procedural; Passe 2 do rodapé, 2026-09-11; ver 3d-procedural.md).
 *
 * O símbolo da Cora é uma linha contínua: mãe, bebê, hibisco e arco num traço só. Aqui essa linha
 * vira tubo fino no espaço, tirado da própria logo (o traço central, `simbolo-traco.ts`). De
 * frente, é a logo. Girando, o desenho mostra que se curva para trás nas laterais, como mãos em
 * concha: a linha que segura sem apertar.
 *
 * PORTÕES (todos do documento aprovado no Passe 0):
 * - o `three` só chega quando o rodapé se aproxima (a 200% de distância), num pedaço de código
 *   separado; o resto do site não paga por ele;
 * - o PÔSTER é o próprio SVG da logo, que já está na página: o volume só aparece quando o
 *   primeiro quadro estiver pronto, e aí os dois trocam de lugar;
 * - `prefers-reduced-motion` e aparelho sem WebGL: fica o SVG, parado e desenhado;
 * - no celular, metade da amplitude, um terço dos segmentos e resolução limitada a 1,5x. Nunca
 *   desligado.
 */
export function SimboloEmVolume() {
  const caixa = useRef<HTMLDivElement | null>(null);
  const [vivo, setVivo] = useState(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelado = false;
    let desmontar: (() => void) | null = null;
    const perto = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        perto.disconnect();
        import("./simbolo-3d")
          .then(({ montarSimbolo }) => {
            if (cancelado) return;
            desmontar = montarSimbolo(el, () => setVivo(true));
          })
          .catch(() => {
            /* sem o volume, o SVG continua no lugar: nada quebra */
          });
      },
      { rootMargin: "200% 0px" },
    );
    perto.observe(el);

    return () => {
      cancelado = true;
      perto.disconnect();
      desmontar?.();
    };
  }, []);

  return <div ref={caixa} className="simbolo-volume" data-vivo={vivo ? "true" : undefined} aria-hidden="true" />;
}
