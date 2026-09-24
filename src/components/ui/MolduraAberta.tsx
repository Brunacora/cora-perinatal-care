"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

/**
 * A MOLDURA ABERTA (autoral, GSAP; 2026-09-11): a forma-assinatura do site em volta de um bloco,
 * desenhada pela rolagem e com um VÃO no meio da aresta de cima.
 *
 * Nasceu para a seção 12, a dos depoimentos que ainda não existem. O roteiro manda a seção ser
 * "honestamente vazia". A moldura diz isso sem uma palavra a mais: é um espaço desenhado e deixado
 * ABERTO em cima, à espera das histórias que vão chegar. É o mesmo traço dos contornos da seção 8
 * (a linha contínua que nunca fecha), então lê como parte do site e não como enfeite novo.
 *
 * O retângulo é redesenhado com as medidas REAIS do bloco a cada refresh e a cada resize, então o
 * traço nunca estica, seja qual for o comprimento do texto ou o idioma.
 *
 * As condições do matchMedia são EXAUSTIVAS de propósito (lição da seção 6): o callback só roda se
 * alguma casar, e com uma brecha a moldura simplesmente não seria desenhada.
 */
export function MolduraAberta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = caixa.current;
      const traco = el?.querySelector<SVGPathElement>(".moldura-aberta-traco");
      const svg = el?.querySelector<SVGSVGElement>(".moldura-aberta-svg");
      if (!el || !traco || !svg) return;

      /* o vão fica no MEIO da aresta de cima: o traço começa à direita dele, dá a volta inteira
         no sentido do relógio e para à esquerda dele */
      const desenhar = () => {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (!w || !h) return;
        const r = 16;
        const o = 0.75;
        const inicio = w * 0.6;
        const fim = w * 0.4;
        const d = [
          `M ${inicio.toFixed(1)} ${o}`,
          `H ${w - r - o} A ${r} ${r} 0 0 1 ${w - o} ${r + o}`,
          `V ${h - r - o} A ${r} ${r} 0 0 1 ${w - r - o} ${h - o}`,
          `H ${r + o} A ${r} ${r} 0 0 1 ${o} ${h - r - o}`,
          `V ${r + o} A ${r} ${r} 0 0 1 ${r + o} ${o}`,
          `H ${fim.toFixed(1)}`,
        ].join(" ");
        traco.setAttribute("d", d);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      };
      desenhar();

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          desenhar();

          if (!anima) {
            gsap.set(traco, { drawSVG: "0% 100%" });
            return;
          }

          /* quem desenha é a mão de quem rola, como nos contornos da seção 8 */
          gsap.fromTo(
            traco,
            { drawSVG: "0% 0%" },
            {
              drawSVG: "0% 100%",
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                end: "top 42%",
                scrub: 0.5,
                invalidateOnRefresh: true,
                onRefresh: desenhar,
              },
            },
          );
        },
      );

      window.addEventListener("resize", desenhar);
      return () => window.removeEventListener("resize", desenhar);
    },
    { scope: caixa },
  );

  return (
    <div ref={caixa} className={`moldura-aberta ${className}`}>
      <svg className="moldura-aberta-svg" aria-hidden="true" preserveAspectRatio="none">
        <path className="moldura-aberta-traco" />
      </svg>
      <div className="moldura-aberta-corpo">{children}</div>
    </div>
  );
}
