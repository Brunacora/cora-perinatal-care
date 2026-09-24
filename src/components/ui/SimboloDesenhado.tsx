"use client";

import { useRef } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { SIMBOLO_TRACO_D } from "./simbolo-traco-d";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

/**
 * O símbolo em TRAÇO que se desenha (a linha central da logo, 2026-09-11).
 *
 * A linha da marca se desenha uma vez, de cima para baixo, do arco até o hibisco. É gatilho (a
 * chegada numa página), não trilho: serve à página 404 e, no Passe 3, à hero.
 * Reduced-motion: o símbolo aparece inteiro, sem desenho.
 */
export function SimboloDesenhado({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement | null>(null);

  useGSAP(
    () => {
      const el = svg.current;
      if (!el) return;
      const fios = gsap.utils.toArray<SVGPathElement>(".simbolo-traco-fio", el);
      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          if (!anima) {
            gsap.set(fios, { drawSVG: "0% 100%" });
            gsap.set(el, { visibility: "visible" });
            return;
          }
          gsap.set(fios, { drawSVG: "0% 0%" });
          gsap.set(el, { visibility: "visible" });
          gsap.to(fios, {
            drawSVG: "0% 100%",
            duration: 1.1,
            ease: "power2.inOut",
            stagger: { amount: 1.8 },
            delay: 0.25,
          });
        },
      );
    },
    { scope: svg },
  );

  const [x, y, w, h] = SIMBOLO_TRACO_D.viewBox;
  return (
    <svg
      ref={svg}
      className={`simbolo-traco ${className}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={SIMBOLO_TRACO_D.largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SIMBOLO_TRACO_D.tracos.map((d, i) => (
        <path key={i} className="simbolo-traco-fio" d={d} />
      ))}
    </svg>
  );
}
