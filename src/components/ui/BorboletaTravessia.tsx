"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** onde ela pousa: no ombro do arco de uma foto, ou na ponta da linha que deixa o vão aberto */
type Pouso = "ombro-do-arco" | "ponta-do-vao";

/**
 * A BORBOLETA QUE ATRAVESSA A EMENDA (Passe 3, 2026-09-11). A ideia é do Gabriel: as borboletas
 * cruzando a fronteira entre as seções, em vez de viverem presas dentro de uma.
 *
 * Ela entra pela borda da tela ainda na seção de cima, desce pela emenda na mão de quem rola
 * (trilho, não gatilho) e POUSA num lugar que tem sentido: no arco da foto da Bruna, na seção 2 (a
 * borboleta do mundo desenhado da hero chega à mulher de verdade), e na ponta do traço da moldura
 * aberta, na seção 12 (pousa onde as histórias vão chegar). Pousada, a asa bate devagar, como a
 * de uma borboleta parada.
 *
 * O caminho é medido em relação ao PAI dela, que precisa ter `position: relative`. Na seção 2 o pai
 * é a própria foto: a foto sobe mais depressa que a página (a camada da frente), e a borboleta,
 * morando dentro dela, sobe junto e nunca descola do arco. O trajeto corre no respiro entre as
 * seções, longe do texto.
 *
 * Posse: GSAP, e este é um elemento novo, só dela. Reduced-motion: já pousada, sem bater a asa.
 */
export function BorboletaTravessia({
  alvo,
  pouso,
  imagem,
  entrada = "direita",
}: {
  /** seletor do lugar do pouso, dentro da mesma seção */
  alvo: string;
  pouso: Pouso;
  imagem: { src: string; w: number; h: number };
  entrada?: "direita" | "esquerda";
}) {
  const raiz = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const camada = raiz.current;
      const pai = camada?.parentElement;
      const secao = camada?.closest<HTMLElement>("section");
      const borboleta = camada?.querySelector<HTMLElement>(".borboleta");
      const asa = camada?.querySelector<HTMLElement>(".borboleta-asa");
      const alvoEl = secao?.querySelector<HTMLElement>(alvo);
      if (!camada || !pai || !secao || !borboleta || !asa || !alvoEl) return;

      /* o trajeto, em pixels, relativo ao pai: saída, dois pontos de controle e o pouso */
      const g = { sx: 0, sy: 0, ax: 0, ay: 0, bx: 0, by: 0, ex: 0, ey: 0 };
      const lado = entrada === "direita" ? 1 : -1;

      const medir = () => {
        const html = document.documentElement;
        const vw = html.clientWidth;
        const vh = html.clientHeight;
        const rp = pai.getBoundingClientRect();
        const rs = secao.getBoundingClientRect();
        const ra = alvoEl.getBoundingClientRect();
        const w = borboleta.offsetWidth;
        const esq = ra.left - rp.left;
        const topo = ra.top - rp.top;
        if (pouso === "ombro-do-arco") {
          /* o topo do arco é meia circunferência com o diâmetro da largura: o ponto a 45 graus
             do lado direito é o ombro, onde a linha já desce */
          const r = ra.width / 2;
          g.ex = esq + r + r * Math.SQRT1_2;
          g.ey = topo + r - r * Math.SQRT1_2;
        } else {
          /* a moldura aberta começa o traço a 60% da aresta de cima: é a ponta da linha */
          g.ex = esq + ra.width * 0.6;
          g.ey = topo + 0.75;
        }
        /* a saída fica fora da tela, na altura do respiro da seção de cima */
        g.sx = lado > 0 ? vw - rp.left + w : -rp.left - w * 1.4;
        g.sy = rs.top - rp.top - vh * 0.17;
        g.ax = g.sx + (g.ex - g.sx) * 0.38;
        g.ay = g.sy + vh * 0.1;
        g.bx = g.ex + lado * Math.min(vw * 0.1, 140);
        g.by = g.ey - vh * 0.12;
      };

      /* o ponto do trajeto em t (Bézier cúbica) e a inclinação do voo */
      const colocar = (t: number) => {
        const u = 1 - t;
        const x = u * u * u * g.sx + 3 * u * u * t * g.ax + 3 * u * t * t * g.bx + t * t * t * g.ex;
        const y = u * u * u * g.sy + 3 * u * u * t * g.ay + 3 * u * t * t * g.by + t * t * t * g.ey;
        const w = borboleta.offsetWidth;
        const h = borboleta.offsetHeight;
        /* o corpo dela (a base da imagem) assenta no ponto de pouso */
        gsap.set(borboleta, {
          x: x - w / 2,
          y: y - h * 0.9,
          rotation: Math.pow(u, 1.5) * -lado * 15 + Math.sin(t * Math.PI * 3) * 5 * u,
        });
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          anima: "(prefers-reduced-motion: no-preference)",
          reduzido: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          medir();

          if (!anima) {
            colocar(1);
            const aoRemedir = () => {
              medir();
              colocar(1);
            };
            ScrollTrigger.addEventListener("refresh", aoRemedir);
            return () => ScrollTrigger.removeEventListener("refresh", aoRemedir);
          }

          /* a asa: o mesmo bater das outras borboletas do site; pousada, fica lenta */
          const bater = gsap.to(asa, {
            scaleX: 0.55,
            duration: 0.26,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            transformOrigin: "50% 50%",
          });
          let pousada = false;

          const estado = { t: 0 };
          const voo = gsap.to(estado, {
            t: 1,
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: secao,
              start: "top 92%",
              endTrigger: alvoEl,
              end: "top 42%",
              scrub: 0.8,
              invalidateOnRefresh: true,
              onRefresh: () => {
                medir();
                colocar(estado.t);
              },
            },
            onUpdate: () => {
              colocar(estado.t);
              const agora = estado.t > 0.985;
              if (agora !== pousada) {
                pousada = agora;
                gsap.to(bater, { timeScale: agora ? 0.28 : 1, duration: 0.5, overwrite: true });
              }
            },
          });
          colocar(estado.t);

          return () => {
            voo.kill();
            bater.kill();
          };
        },
      );
    },
    { scope: raiz, dependencies: [alvo, pouso, entrada] },
  );

  return (
    <span className="travessia" ref={raiz} aria-hidden="true">
      <span className="borboleta borboleta-travessia">
        <span className="borboleta-asa">
          <Image src={imagem.src} alt="" width={imagem.w} height={imagem.h} sizes="96px" />
        </span>
      </span>
    </span>
  );
}
