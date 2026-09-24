"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { camada, corpoUmaVez, tituloEmTrilho } from "@/lib/camera";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * A CÂMERA POR CIMA DE UMA SEÇÃO (Passe 3, 2026-09-11).
 *
 * As seções 2, 11 e 12 são componentes de servidor e duas delas levam componente do catálogo,
 * dono do próprio movimento (o Reveal Image Mask e o Interactive Accordion, em Motion). O que a
 * câmera faz nelas é só o que a tabela de posse do `componentes-21st.md` dá ao GSAP: o título, o
 * corpo e as camadas que se separam, nunca um elemento de dentro do componente do catálogo.
 *
 * Por isso este componente não desenha nada: é uma âncora escondida que acha a própria seção e
 * aplica nela a caligrafia de `lib/camera.ts`, a mesma das seções autorais.
 *
 * O título é cortado com `autoSplit`: se a fonte chega depois do corte, ou a largura muda, o
 * SplitText corta de novo e a entrada é refeita junto (a lição do sumário da seção 4, onde o corte
 * com a fonte de reserva quebrava palavra no meio).
 * Reduced-motion: tudo no estado final.
 */
export function CameraSecao({
  titulo,
  corpo,
  camadas = [],
}: {
  /** seletor do título, dentro da seção */
  titulo?: string;
  /** seletor dos parágrafos que entram uma vez */
  corpo?: string;
  /** o que se separa ao rolar, com a amplitude de desktop em vh (metade no celular) */
  camadas?: { seletor: string; vh: number }[];
}) {
  const ancora = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const secao = ancora.current?.closest<HTMLElement>("section, footer");
      if (!secao) return;
      const tituloEl = titulo ? secao.querySelector<HTMLElement>(titulo) : null;
      const corpoEls = corpo ? gsap.utils.toArray<HTMLElement>(corpo, secao) : [];

      const mm = gsap.matchMedia();
      mm.add(
        {
          anima: "(prefers-reduced-motion: no-preference)",
          reduzido: "(prefers-reduced-motion: reduce)",
          estreito: "(max-width: 767px)",
        },
        (ctx) => {
          const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };
          if (!anima) {
            if (corpoEls.length) gsap.set(corpoEls, { opacity: 1, y: 0 });
            return;
          }

          const corte = tituloEl
            ? SplitText.create(tituloEl, {
                type: "lines",
                mask: "lines",
                linesClass: "camera-linha",
                autoSplit: true,
                /* preserva o espaço inflexível que cola as últimas palavras (lib/tipografia.ts):
                   com o padrão, o SplitText trocava todos por espaço comum antes de medir as
                   linhas, e a palavra solta voltava */
                reduceWhiteSpace: false,
                onSplit: (self) => tituloEmTrilho(self.lines, tituloEl) ?? undefined,
              })
            : null;

          corpoUmaVez(corpoEls);

          camadas.forEach(({ seletor, vh }) => {
            const el = secao.querySelector<HTMLElement>(seletor);
            if (el) camada(el, vh, secao, estreito);
          });

          return () => corte?.revert();
        },
      );
    },
    { dependencies: [titulo, corpo, JSON.stringify(camadas)] },
  );

  return <span ref={ancora} hidden aria-hidden="true" />;
}
