"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * A FITA DO CADERNO (2026-09-24, aprovada pelo Gabriel): o elemento vivo EXCLUSIVO do journal. O blog
 * é "um caderno de cabeceira", e todo caderno assim tem uma fita marcadora. Terracota, de tecido, com
 * a ponta cortada em duas pétalas (o hibisco da logo).
 *
 * TRÊS APARIÇÕES, cada uma com um sentido (as quatro perguntas do elemento vivo, design-blog.md):
 * - escapa de baixo do card "Start here": é por ali que se começa;
 * - escapa de baixo da capa do artigo: a página que está aberta;
 * - pende do alto do "From Bruna", ao lado da foto: marca onde a leitora parou, junto de quem escreve.
 * Onde NÃO entra: na grade, no corpo do texto, no rodapé.
 *
 * O MOVIMENTO (autoral, GSAP):
 * - DESENROLA quando chega à tela (trilho: a fita cresce de cima para baixo com a rolagem);
 * - RESPOSTA: balança com a VELOCIDADE da rolagem, com a ponta atrasada do corpo (dois segmentos,
 *   como tecido), e assenta devagar, sem quique (movimento.md: nada elástico). Receita de pico e
 *   volta: só o pico é registrado, e um tween devolve ao repouso;
 * - no mouse (ponteiro fino) e no toque, um balanço pequeno;
 * - parada, respira de leve, e o laço PAUSA fora da tela.
 * Reduced-motion: inteira, parada. Decorativa: aria-hidden.
 */
export function FitaDoCaderno({ onde }: { onde: "destaque" | "capa" | "autoria" | "autoria-celular" }) {
  const raiz = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const fita = raiz.current;
      const cima = fita?.querySelector<HTMLElement>(".fita-cima");
      const baixo = fita?.querySelector<HTMLElement>(".fita-baixo");
      if (!fita || !cima || !baixo) return;

      const mm = gsap.matchMedia();
      mm.add({ anima: "(prefers-reduced-motion: no-preference)", estreito: "(max-width: 767px)" }, (ctx) => {
        const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };
        if (!anima) return;

        /* desenrola */
        gsap.fromTo(
          fita,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "50% 0%",
            scrollTrigger: { trigger: fita, start: "top 92%", end: "top 55%", scrub: 0.8 },
          },
        );

        /* o balanço: o corpo gira no ponto de onde a fita sai, a ponta gira de novo no meio */
        const girarCima = gsap.quickTo(cima, "rotation", { duration: 0.35, ease: "power2.out" });
        const girarBaixo = gsap.quickTo(baixo, "rotation", { duration: 0.55, ease: "power2.out" });
        const teto = estreito ? 7 : 11;
        let pico = 0;
        let volta: gsap.core.Tween | null = null;
        const assentar = () => {
          volta?.kill();
          const estado = { a: pico };
          volta = gsap.to(estado, {
            a: 0,
            duration: 1.8,
            ease: "power2.inOut",
            delay: 0.12,
            onUpdate: () => {
              pico = estado.a;
              girarCima(estado.a);
              girarBaixo(estado.a * 0.85);
            },
          });
        };
        const empurrar = (angulo: number) => {
          if (Math.abs(angulo) <= Math.abs(pico)) return;
          volta?.kill();
          pico = angulo;
          girarCima(angulo);
          girarBaixo(angulo * 0.85);
          assentar();
        };

        /* a respiração parada: um laço mínimo na ponta, que só roda com a fita na tela */
        const respira = gsap.to(fita.querySelector(".fita-respira"), {
          rotation: 1.2,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: fita,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? respira.play() : respira.pause()),
          onUpdate: (self) => {
            /* rolar para baixo empurra a ponta para um lado, para cima, para o outro */
            const v = self.getVelocity();
            const angulo = gsap.utils.clamp(-teto, teto, -v / 160);
            if (Math.abs(angulo) > 1.5) empurrar(angulo);
          },
        });
        /* `onToggle` não dispara na criação: a fita que já nasce na tela começa respirando */
        if (ScrollTrigger.isInViewport(fita)) respira.play();

        const aoTocar = () => empurrar(pico >= 0 ? -teto * 0.6 : teto * 0.6);
        fita.addEventListener("pointerenter", aoTocar);
        fita.addEventListener("pointerdown", aoTocar);
        return () => {
          fita.removeEventListener("pointerenter", aoTocar);
          fita.removeEventListener("pointerdown", aoTocar);
          volta?.kill();
          respira.kill();
        };
      });
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className="fita" data-onde={onde} data-camada="frente" aria-hidden="true">
      <div className="fita-cima">
        <div className="fita-baixo">
          <div className="fita-respira">
            <span className="fita-ponta" />
          </div>
        </div>
      </div>
    </div>
  );
}
