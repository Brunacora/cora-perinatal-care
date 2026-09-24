"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * O HIBISCO QUE SE ABRE (2026-09-24, pedido do Gabriel: "bem minimalista, em lugares estratégicos").
 * A flor da logo, a uma linha só, pequena. As cinco pétalas começam juntas, fechadas como um botão, e
 * se abrem uma a uma, desenhando-se.
 *
 * Dois modos:
 * - `rolagem`: abre com a rolagem, em trilho (ao lado de "The Cora Journal started there." e de
 *   "Keep reading");
 * - `foco`: abre quando o controle a que pertence está ativo ou sob o mouse (a pílula "Em português":
 *   o hibisco é a raiz brasileira da marca). Fechado, ele fica como botão de flor.
 * Reduced-motion: aberto e parado. Decorativo: aria-hidden.
 */
const PETALA = "M0 0 C -14 -16, -12 -42, 0 -50 C 12 -42, 14 -16, 0 0";

export function Hibisco({
  modo = "rolagem",
  aberto = false,
  className = "",
}: {
  modo?: "rolagem" | "foco";
  /** só no modo `foco`: o controle está ativo */
  aberto?: boolean;
  className?: string;
}) {
  const svg = useRef<SVGSVGElement | null>(null);

  useGSAP(
    () => {
      const el = svg.current;
      if (!el) return;
      const petalas = gsap.utils.toArray<SVGPathElement>(".hibisco-petala", el);
      const abrir = (tl: gsap.core.Timeline) => {
        petalas.forEach((p, i) => {
          tl.fromTo(
            p,
            /* fechado: na rolagem, as cinco pétalas juntas num leque estreito, ainda por desenhar (o
               botão que se abre desenhando-se); na pílula, uma flor pequena e girada, que se abre
               num quinto de volta (medido: o leque a 20px lia como um coração cheio) */
            modo === "foco"
              ? { rotation: i * 72 - 36, scale: 0.55, "--p": 1 }
              : { rotation: (i - 2) * 11, scale: 0.55, "--p": 0 },
            { rotation: i * 72, scale: 1, "--p": 1, svgOrigin: "0 0", ease: "power2.inOut", duration: 1 },
            i * 0.12,
          );
        });
        return tl;
      };

      const mm = gsap.matchMedia();
      mm.add(
        { anima: "(prefers-reduced-motion: no-preference)", reduzido: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          if (!anima) {
            petalas.forEach((p, i) => gsap.set(p, { rotation: i * 72, svgOrigin: "0 0", "--p": 1 }));
            return;
          }
          if (modo === "rolagem") {
            abrir(
              gsap.timeline({
                scrollTrigger: { trigger: el, start: "top 88%", end: "top 55%", scrub: 0.6 },
              }),
            );
            return;
          }
          /* modo foco: uma linha do tempo pausada, que abre e fecha com o estado do controle */
          const tl = abrir(gsap.timeline({ paused: true, defaults: { duration: 0.5 } }));
          tl.timeScale(1.6);
          (el as unknown as { __abrir?: (v: boolean) => void }).__abrir = (v: boolean) =>
            v ? tl.play() : tl.reverse();
          const botao = el.closest("button");
          const entra = () => tl.play();
          const sai = () => {
            if (botao?.getAttribute("aria-checked") !== "true") tl.reverse();
          };
          if (botao?.getAttribute("aria-checked") === "true") tl.progress(1);
          botao?.addEventListener("pointerenter", entra);
          botao?.addEventListener("pointerleave", sai);
          botao?.addEventListener("focus", entra);
          botao?.addEventListener("blur", sai);
          return () => {
            botao?.removeEventListener("pointerenter", entra);
            botao?.removeEventListener("pointerleave", sai);
            botao?.removeEventListener("focus", entra);
            botao?.removeEventListener("blur", sai);
          };
        },
      );
    },
    { scope: svg },
  );

  /* o estado do controle mudou (a pílula foi escolhida ou deixou de ser) */
  useGSAP(
    () => {
      const el = svg.current as unknown as { __abrir?: (v: boolean) => void } | null;
      if (modo === "foco") el?.__abrir?.(aberto);
    },
    { dependencies: [aberto, modo] },
  );

  return (
    <svg ref={svg} className={`hibisco ${className}`} data-modo={modo} viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          className="hibisco-petala"
          d={PETALA}
          pathLength={1}
          transform={modo === "foco" ? `rotate(${i * 72 - 36}) scale(0.55)` : `rotate(${(i - 2) * 11}) scale(0.55)`}
        />
      ))}
      <circle className="hibisco-miolo" r="4.5" />
    </svg>
  );
}
