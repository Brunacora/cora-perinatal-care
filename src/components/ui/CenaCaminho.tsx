"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { FiguraAndando } from "./FiguraAndando";
import { tituloEmTrilho } from "@/lib/camera";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export type Passo = { title: string; text: string };

/**
 * Seção 7, "Starting is simple": O CAMINHO (autoral, GSAP; 2026-09-11).
 *
 * POR QUE ESTA SEÇÃO NÃO É UMA CENA PRESA, e é decisão e não preguiça: a copy diz "começar é
 * simples". Prender a tela e obrigar a pessoa a atravessar uma coreografia de três telas diria o
 * contrário da frase. Aqui a forma precisa concordar com o texto: fluxo normal, ar, três passos
 * legíveis de uma vez. É um VALE, e vale é o silêncio que faz o pico valer.
 *
 * O QUE O PASSE 0 JÁ TINHA DECIDIDO (componentes-21st.md, seção 7): autoral. Os achados do
 * catálogo foram lidos e reprovados no próprio Passe 0. O Scroll Reveal Content A (19203) prendia
 * três telas para três linhas de texto e escondia a imagem no celular; o How It Works (19861) era
 * lúdico demais para a marca; o Svg follow scroll (7288) era só a linha, sem os passos.
 *
 * A LINHA TEM UM TRABALHO, e é isso que a separa de enfeite. O Gabriel reprovou, com razão, uma
 * linha que apenas se completava ao passar na seção 6: aquilo era rabisco com barra de progresso
 * dentro. Aqui a linha é O CHÃO, e a mulher da seção 3 CAMINHA por ele, do passo 01 ao 03,
 * conforme a rolagem. A linha existe porque alguém precisa pisar nela.
 *
 * E ELA SÓ DÁ PASSO QUANDO VOCÊ ROLA. A passada é calculada da DISTÂNCIA percorrida, não do
 * relógio (ver `dirigida` na FiguraAndando). Se a rolagem para, ela para de pé. É o oposto da
 * figura que escorrega numa pose só, que foi o primeiro bug dela lá na seção 3.
 *
 * MESMA MECÂNICA NO CELULAR E NO DESKTOP: o caminho, as três estações e a caminhada são iguais.
 * O que muda é só a arrumação do texto embaixo, três colunas ou empilhado, que é o que responsivo
 * significa.
 *
 * Reduced-motion: a figura some (ela é decorativa), o caminho fica inteiro desenhado e os três
 * passos aparecem no estado final.
 */
export function CenaCaminho({
  tituloId,
  titulo,
  passos,
  cta,
  ctaHref,
}: {
  tituloId: string;
  titulo: string;
  passos: Passo[];
  cta: string;
  ctaHref: string;
}) {
  const secao = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const raiz = secao.current;
      if (!raiz) return;

      const chao = raiz.querySelector<HTMLElement>(".caminho-chao");
      const janela = raiz.querySelector<HTMLElement>(".caminho-figura .figura-janela");
      const estacoes = gsap.utils.toArray<HTMLElement>(".caminho-estacao", raiz);
      const degraus = gsap.utils.toArray<HTMLElement>(".caminho-passo", raiz);
      const tituloEl = raiz.querySelector<HTMLElement>(".caminho-titulo");
      if (!chao) return;

      const corte = tituloEl
        ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras */
          new SplitText(tituloEl, { type: "lines", linesClass: "caminho-linha", mask: "lines", reduceWhiteSpace: false })
        : null;

      const acender = (quantas: number) =>
        estacoes.forEach((e, i) => e.classList.toggle("esta-pisada", i < quantas));

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };

          if (!anima) {
            if (corte) gsap.set(corte.lines, { yPercent: 0, opacity: 1 });
            gsap.set(degraus, { opacity: 1, y: 0 });
            gsap.set(".caminho-trilha", { scaleX: 1 });
            acender(estacoes.length);
            return;
          }

          /* a headline sobe linha a linha, em trilho curto: a mesma caligrafia do resto do site
             (Passe 3; era um gatilho de uma vez só) */
          if (corte && tituloEl) tituloEmTrilho(corte.lines, tituloEl);

          /* os três passos entram em sequência, sem espetáculo */
          gsap.fromTo(
            degraus,
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: { trigger: ".caminho-passos", start: "top 82%", once: true },
            },
          );

          /* O CAMINHO. O chão se estende e ela anda por ele, ligados ao progresso da rolagem.
             O trilho vai de quando a faixa entra na tela até quando ela sai por cima, então a
             travessia inteira cabe na leitura da seção. */
          const percurso = () => Math.max(0, chao.clientWidth - (janela?.clientWidth ?? 0));

          /* O TRILHO TERMINA ENQUANTO A SEÇÃO AINDA ESTÁ NA TELA, de propósito. Medido com
             "bottom 34%" ela chegava só a 69% do caminho, porque perto do fim da página não
             existe rolagem sobrando para completar o percurso. Além de consertar isso, terminar
             cedo conta melhor: ela chega ao passo 03 no momento em que a pessoa acaba de ler. */
          const trilho = {
            trigger: raiz,
            start: "top 85%",
            end: "bottom 75%",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self: ScrollTrigger) => {
              /* a estação acende quando ela PASSA por cima, não antes */
              const p = self.progress;
              acender(estacoes.filter((_, i) => p >= (i + 0.5) / estacoes.length).length);
            },
          };

          gsap.fromTo(
            ".caminho-trilha",
            { scaleX: 0 },
            { scaleX: 1, ease: "none", transformOrigin: "0% 50%", scrollTrigger: trilho },
          );

          if (janela) {
            gsap.fromTo(
              janela,
              { x: 0 },
              { x: percurso, ease: "none", scrollTrigger: trilho },
            );
          }
        },
      );

      return () => corte?.revert();
    },
    { scope: secao, dependencies: [passos.length] },
  );

  return (
    <section id="start" className="secao secao-caminho" aria-labelledby={tituloId} ref={secao}>
      <div className="container caminho">
        <h2 id={tituloId} className="caminho-titulo" data-camada="meio">
          {titulo}
        </h2>

        {/* O CAMINHO: o chão, as três estações e ela andando. Decorativo para quem lê com leitor
            de tela, porque a informação real está nos passos numerados logo abaixo. */}
        <div className="caminho-chao" data-camada="frente" aria-hidden="true">
          <span className="caminho-leito" />
          <span className="caminho-trilha" />
          <div className="caminho-estacoes">
            {/* as estacoes sao itens de uma grade IGUAL a dos passos, entao cada marco cai
                exatamente sob o numero da sua coluna. Posicionar por porcentagem errava em 32px,
                porque a grade dos passos tem gap e porcentagem nao sabe disso. */}
            {passos.map((p) => (
              <span key={p.title} className="caminho-estacao">
                <span className="caminho-marco" />
              </span>
            ))}
          </div>
          <FiguraAndando className="caminho-figura" dirigida />
        </div>

        <ol className="caminho-passos" data-camada="frente">
          {passos.map((p, i) => (
            <li key={p.title} className="caminho-passo">
              <span className="caminho-numero display" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="caminho-passo-titulo">{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ol>

        <a href={ctaHref} className="botao caminho-cta">
          {cta}
        </a>
      </div>
    </section>
  );
}
