"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { tituloEmTrilho } from "@/lib/camera";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, SplitText);

export type Ponto = { title: string; text: string };

/**
 * Seção 8, "Why families choose Cora": OS CONTORNOS (autoral, GSAP; 2026-09-11).
 *
 * AQUI A FORMA-ASSINATURA DO SITE FINALMENTE APARECE INTEIRA. O `design.md` escolheu, entre três
 * candidatas, a LINHA CONTÍNUA: o traço único da logo, que se desenha e NUNCA FECHA
 * completamente. Até agora ela apareceu em pedaços (o arco da seção 3, a moldura dos capítulos
 * da seção 4). Esta é a seção em que ela é o componente.
 *
 * E o contorno aberto não é maneirismo: esta é a seção da confiança, e os quatro pontos dizem
 * "a gente se adapta a você", "sem julgamento". Uma caixa fechada diria o contrário. A abertura
 * do traço muda de lugar em cada card, como quem desenha quatro vezes à mão em vez de carimbar.
 *
 * QUEM DESENHA É A PESSOA. O traço está ligado ao progresso da rolagem (scrub), então o card se
 * desenha na velocidade da mão de quem rola. É o verbo 1 do `movimento.md`, e é trilho e não
 * gatilho: fade de entrada faria a mesma seção parecer um slideshow de quatro caixas.
 *
 * O QUE O PASSE 0 DECIDIU (componentes-21st.md, seção 8): autoral, e a busca está registrada lá.
 * O Sketchbook Reveal Card (7217, dhileepkumargm) tinha o gesto certo mas foi aberto no código e
 * reprovado: demonstração com barras no lugar de texto, altura fixa e contorno de proporção
 * travada, que deforma quando a copy da cliente entra. Aqui o retângulo é redesenhado com as
 * medidas REAIS do card a cada refresh, então o traço nunca estica nem deforma.
 *
 * Reduced-motion: os contornos aparecem inteiros, o texto no estado final.
 */
export function CenaContornos({
  tituloId,
  titulo,
  pontos,
}: {
  tituloId: string;
  titulo: string;
  pontos: Ponto[];
}) {
  const secao = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const raiz = secao.current;
      if (!raiz) return;

      const cards = gsap.utils.toArray<HTMLElement>(".contorno-card", raiz);
      const tituloEl = raiz.querySelector<HTMLElement>(".contorno-titulo");

      const corte = tituloEl
        ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras */
          new SplitText(tituloEl, { type: "lines", linesClass: "contorno-linha", mask: "lines", reduceWhiteSpace: false })
        : null;

      /* A ABERTURA DO TRAÇO muda de card para card. Quatro contornos com a mesma falha no mesmo
         lugar leriam como carimbo; assim leem como quatro gestos de mão. */
      const aberturas = [
        [0.3, 0.44],
        [0.54, 0.68],
        [0.2, 0.33],
        [0.61, 0.75],
      ];

      /* o retângulo com as medidas REAIS do card, e um vão na aresta de cima */
      const desenhar = (card: HTMLElement, i: number) => {
        const traco = card.querySelector<SVGPathElement>(".contorno-traco");
        const svg = card.querySelector<SVGSVGElement>(".contorno-svg");
        if (!traco || !svg) return;
        const w = card.offsetWidth;
        const h = card.offsetHeight;
        if (!w || !h) return;

        const r = 16;
        const o = 0.75; /* meia espessura do traço, para a linha não sair pela borda */
        const [g1, g2] = aberturas[i % aberturas.length];
        const inicio = w * g2;
        const fim = w * g1;

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

      const redesenhar = () => cards.forEach((c, i) => desenhar(c, i));

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          redesenhar();

          if (!anima) {
            if (corte) gsap.set(corte.lines, { yPercent: 0, opacity: 1 });
            gsap.set(".contorno-traco", { drawSVG: "0% 100%" });
            gsap.set(".contorno-corpo > *", { opacity: 1, y: 0 });
            return;
          }

          /* o título em trilho curto, a caligrafia do site inteiro (Passe 3) */
          if (corte && tituloEl) tituloEmTrilho(corte.lines, tituloEl);

          cards.forEach((card, i) => {
            const traco = card.querySelector<SVGPathElement>(".contorno-traco");
            const corpo = gsap.utils.toArray<HTMLElement>(".contorno-corpo > *", card);

            /* O TRAÇO SE DESENHA NA MÃO DE QUEM ROLA. A faixa é curta de propósito: um trilho
               longo demais faz o card ficar meio desenhado por meia tela, o que lê como bug. */
            if (traco) {
              gsap.fromTo(
                traco,
                { drawSVG: "0% 0%" },
                {
                  drawSVG: "0% 100%",
                  ease: "none",
                  scrollTrigger: {
                    trigger: card,
                    start: "top 88%",
                    end: "top 46%",
                    scrub: 0.5,
                    invalidateOnRefresh: true,
                    onRefresh: () => desenhar(card, i),
                  },
                },
              );
            }

            if (corpo.length) {
              gsap.fromTo(
                corpo,
                { opacity: 0, y: 16 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.55,
                  stagger: 0.08,
                  ease: "power2.out",
                  scrollTrigger: { trigger: card, start: "top 74%", once: true },
                },
              );
            }
          });
        },
      );

      window.addEventListener("resize", redesenhar);
      return () => {
        window.removeEventListener("resize", redesenhar);
        corte?.revert();
      };
    },
    { scope: secao, dependencies: [pontos.length] },
  );

  return (
    <section id="why" className="secao secao-contornos" aria-labelledby={tituloId} ref={secao}>
      <div className="campo-papel2" data-camada="fundo" aria-hidden="true" />
      <div className="container contornos">
        <h2 id={tituloId} className="contorno-titulo" data-camada="meio">
          {titulo}
        </h2>

        <div className="contornos-grade" data-camada="meio">
          {pontos.map((p) => (
            <article key={p.title} className="contorno-card">
              {/* o contorno é a forma-assinatura da marca, e é decorativo: o conteúdo está no
                  texto ao lado dele */}
              <svg className="contorno-svg" aria-hidden="true" preserveAspectRatio="none">
                <path className="contorno-traco" />
              </svg>
              <div className="contorno-corpo">
                <h3 className="contorno-ponto">{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
