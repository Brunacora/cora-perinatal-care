"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ANIMA_OU_REDUZIDO } from "./CameraJournal";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * O SUBLINHADO À MÃO (2026-09-24). Uma frase por artigo, marcada pela Bruna no painel ("Sublinhar à
 * mão"), ganha um traço ondulado de tinta terracota por baixo, desenhado com a rolagem quando a
 * leitora chega nela: é a Bruna passando a caneta na frase que ela quer que fique.
 *
 * Por que medir linha a linha: a frase quebra em duas ou três linhas, e nem sublinhado de CSS nem
 * SVG preso ao `span` desenham um traço que ANDA de uma linha para a próxima. Aqui cada linha real
 * (`getClientRects`) ganha um traço próprio, com um tremor de mão determinístico, e o progresso da
 * rolagem se reparte entre as linhas pela largura de cada uma. Remede a cada refresh do
 * ScrollTrigger (largura nova, fonte que chegou).
 *
 * O traço mora num SVG por cima da coluna, fora do texto (aria-hidden): o texto não se move.
 * Reduced-motion: desenhado inteiro.
 */
const NS = "http://www.w3.org/2000/svg";

/** Um traço de caneta: onda baixa, período irregular, e a ponta sobe um pouco no fim. */
function traco(x0: number, x1: number, y: number, semente: number) {
  let s = semente;
  const acaso = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = `M ${x0.toFixed(1)} ${(y + 0.6).toFixed(1)}`;
  let x = x0;
  let lado = 1;
  while (x < x1 - 1) {
    const passo = Math.min(18 + acaso() * 10, x1 - x);
    const alto = (1.1 + acaso() * 0.8) * lado;
    const fim = x + passo >= x1 - 1;
    const yFim = fim ? y - 1.6 : y + (acaso() - 0.5) * 0.6;
    d += ` Q ${(x + passo / 2).toFixed(1)} ${(y + alto).toFixed(1)} ${(x + passo).toFixed(1)} ${yFim.toFixed(1)}`;
    x += passo;
    lado *= -1;
  }
  return d;
}

export function Sublinhado({ children }: { children?: ReactNode }) {
  const frase = useRef<HTMLSpanElement | null>(null);

  useGSAP(() => {
    const el = frase.current;
    const coluna = el?.closest<HTMLElement>(".prosa");
    if (!el || !coluna) return;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "sublinhado-traco");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    coluna.appendChild(svg);

    let linhas: { path: SVGPathElement; peso: number }[] = [];
    let progresso = 0;

    const pintar = () => {
      let antes = 0;
      linhas.forEach(({ path, peso }) => {
        const local = gsap.utils.clamp(0, 1, (progresso - antes) / peso);
        path.style.strokeDashoffset = String(1 - local);
        antes += peso;
      });
    };

    /* lê tudo, depois escreve tudo (sem reflow forçado no meio) */
    const medir = () => {
      const base = coluna.getBoundingClientRect();
      const caixas = [...el.getClientRects()].filter((r) => r.width > 2);
      const juntas: DOMRect[] = [];
      caixas.forEach((r) => {
        const mesma = juntas.find((j) => Math.abs(j.bottom - r.bottom) < 4);
        if (mesma) {
          const x = Math.min(mesma.left, r.left);
          const direita = Math.max(mesma.right, r.right);
          juntas[juntas.indexOf(mesma)] = new DOMRect(x, mesma.top, direita - x, mesma.height);
        } else juntas.push(r);
      });
      const total = juntas.reduce((soma, r) => soma + r.width, 0) || 1;

      svg.replaceChildren();
      svg.setAttribute("width", String(base.width));
      svg.setAttribute("height", String(base.height));
      svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
      linhas = juntas.map((r, i) => {
        const path = document.createElementNS(NS, "path");
        /* 2px abaixo da caixa da letra: mais perto, o traço cortava a perna do "p" e do "g" */
        const y = r.bottom - base.top + 2;
        path.setAttribute("d", traco(r.left - base.left - 1, r.right - base.left + 2, y, 17 + i * 31));
        path.setAttribute("pathLength", "1");
        svg.appendChild(path);
        return { path, peso: r.width / total };
      });
      pintar();
    };

    medir();
    ScrollTrigger.addEventListener("refresh", medir);
    document.fonts?.ready.then(medir).catch(() => {});

    const mm = gsap.matchMedia();
    mm.add(ANIMA_OU_REDUZIDO, (ctx) => {
      const { anima } = ctx.conditions as { anima: boolean };
      if (!anima) {
        progresso = 1;
        pintar();
        return;
      }
      progresso = 0;
      pintar();
      const estado = { p: 0 };
      gsap.to(estado, {
        p: 1,
        ease: "none",
        onUpdate: () => {
          progresso = estado.p;
          pintar();
        },
        scrollTrigger: { trigger: el, start: "top 80%", end: "top 52%", scrub: 0.8 },
      });
    });

    return () => {
      ScrollTrigger.removeEventListener("refresh", medir);
      svg.remove();
    };
  });

  return (
    <span ref={frase} className="sublinhado">
      {children}
    </span>
  );
}
