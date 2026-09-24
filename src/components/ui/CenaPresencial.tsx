"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { FiguraAndando } from "./FiguraAndando";
import { Inteiras } from "../Enfase";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

type Foto = { src: string; alt: string };

/**
 * A cena do suporte presencial: "a linha que segura" (autoral, GSAP + ScrollTrigger, 2026-09-10).
 * Um trecho de rolagem dirige tudo (scrub): o campo pêssego sobe e entrega a cena; a linha da
 * marca se DESENHA em volta do quadro (DrawSVG) e é o próprio indicador de progresso; enquanto
 * ela avança, as três fotos dissolvem uma na outra com um zoom lento e a lista de serviços
 * acende item a item, como se a linha a escrevesse; o botão chega por último.
 * Desktop com altura suficiente: a cena fica presa (pin curto, 120% de rolagem). Mobile e telas
 * baixas: sem pin, o mesmo trecho dirigido pela passagem da seção. Reduced-motion: estado final.
 * Posse: GSAP. Nada de Motion nesta seção.
 */
export function CenaPresencial({
  tituloId,
  titulo,
  short,
  p1,
  p2,
  more,
  bullets,
  price,
  cta,
  ctaHref,
  fotos,
}: {
  tituloId: string;
  titulo: string;
  short: string;
  p1: string;
  p2: string;
  more: string;
  bullets: string[];
  /** o valor de entrada, fora da lista: preço no meio de uma lista de serviços lê como serviço */
  price: string;
  cta: string;
  ctaHref: string;
  fotos: Foto[];
}) {
  const secao = useRef<HTMLElement | null>(null);
  const cena = useRef<HTMLDivElement | null>(null);
  const moldura = useRef<HTMLDivElement | null>(null);
  const traco = useRef<SVGPathElement | null>(null);

  useGSAP(
    () => {
      const raiz = secao.current;
      const quadro = cena.current;
      const caixa = moldura.current;
      const linha = traco.current;
      if (!raiz || !quadro || !caixa || !linha) return;

      const campo = raiz.querySelector<HTMLElement>(".campo-pessego");
      const fotosEl = gsap.utils.toArray<HTMLElement>(".cena-foto", raiz);
      const imgs = gsap.utils.toArray<HTMLElement>(".cena-foto img", raiz);
      /* O QUE A LINHA ESCREVE MUDOU em 2026-09-23. Antes a cena acendia a LISTA, porque a lista
         estava à vista e os dois parágrafos é que ficavam atrás do "Read more". A Bruna pediu o
         contrário: os parágrafos à vista e a lista atrás do botão. Então quem acende agora são os
         parágrafos, que é o que a pessoa de fato lê enquanto a moldura se desenha. */
      const paragrafos = gsap.utils.toArray<HTMLElement>(".cena-paragrafo", raiz);
      const botao = raiz.querySelector<HTMLElement>(".cena-cta");
      const detalhes = raiz.querySelector<HTMLDetailsElement>("details");

      /* a moldura é um caminho fechado desenhado no tamanho real do quadro (raio 28 = 16 + 12) */
      const desenharMoldura = () => {
        const w = caixa.offsetWidth;
        const h = caixa.offsetHeight;
        const r = 28;
        const o = 0.75;
        const d = [
          `M ${w / 2} ${o}`,
          `H ${w - r - o} A ${r} ${r} 0 0 1 ${w - o} ${r + o}`,
          `V ${h - r - o} A ${r} ${r} 0 0 1 ${w - r - o} ${h - o}`,
          `H ${r + o} A ${r} ${r} 0 0 1 ${o} ${h - r - o}`,
          `V ${r + o} A ${r} ${r} 0 0 1 ${r + o} ${o}`,
          `Z`,
        ].join(" ");
        linha.setAttribute("d", d);
      };
      desenharMoldura();

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          movimento: "(prefers-reduced-motion: no-preference)",
          /* 820px de altura, não 720: com o "Read more" aberto a coluna de texto chega a
             cerca de 740px num desktop estreito, e prender a cena numa tela mais baixa que isso
             deixaria conteúdo fora de quadro. Abaixo desse piso a cena não prende e a seção
             simplesmente rola, que é feio de menos e correto de mais. */
          presa: "(min-width: 900px) and (min-height: 820px)",
        },
        (ctx) => {
          const { reduzido, presa } = ctx.conditions as { reduzido: boolean; presa: boolean };

          if (reduzido) {
            gsap.set(linha, { drawSVG: "0% 100%" });
            gsap.set(paragrafos, { opacity: 1 });
            gsap.set(botao, { opacity: 1, y: 0 });
            gsap.set(fotosEl[0], { opacity: 1 });
            if (campo) gsap.set(campo, { scaleY: 1 });
            return;
          }

          /* estado inicial explícito: sem isso os itens que só começam mais tarde na linha do
             tempo ficam na opacidade natural até o playhead chegar neles */
          gsap.set(paragrafos, { opacity: 0, y: 10 });
          if (botao) gsap.set(botao, { opacity: 0, y: presa ? 10 : 5 });
          gsap.set(linha, { drawSVG: "0% 0%" });

          /* 1. o campo sobe e entrega a cena (o verbo "o campo sobe") */
          if (campo) {
            gsap.fromTo(
              campo,
              { scaleY: 0, transformOrigin: "50% 100%" },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: { trigger: raiz, start: "top 98%", end: "top 30%", scrub: 0.6 },
              },
            );
          }

          /* 2. a cena: a linha se desenha, as fotos dissolvem, a lista acende */
          /* O RITMO AFROUXOU (Bruna, 2026-09-23: "mudou muito rápido, tanto as fotos quanto as
             linhas"). Duas mudanças, e a segunda responde a uma observação dela ainda mais
             precisa: "a linha não chega até o final antes de descer na página".
             1. As trocas de foto saíram de 0,34 e 0,62 para 0,30 e 0,56, com a dissolução mais
                longa (0,12 para 0,2): a foto agora ATRAVESSA em vez de piscar.
             2. A moldura fecha em 0,85 do trilho e não em 1,0. Fechando junto com o fim do pino,
                o atraso do scrub garantia que a pessoa saísse da cena antes de o quadro fechar.
                Agora ela vê o traço encontrar o começo, que é o ponto inteiro do gesto. */
          const fotosNaLinha = (tl: gsap.core.Timeline) => {
            tl.fromTo(linha, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.85 }, 0);
            tl.fromTo(imgs, { scale: 1 }, { scale: 1.06, duration: 1 }, 0);
            if (fotosEl[1]) tl.fromTo(fotosEl[1], { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.3);
            if (fotosEl[2]) tl.fromTo(fotosEl[2], { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.56);
          };
          const textoNaLinha = (tl: gsap.core.Timeline, inicio: number, fimBotao: number) => {
            tl.fromTo(
              paragrafos,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.18, stagger: 0.12 },
              inicio,
            );
            if (botao) tl.fromTo(botao, { opacity: 0, y: presa ? 10 : 5 }, { opacity: 1, y: 0, duration: 0.1 }, fimBotao);
          };

          if (presa) {
            /* desktop: a cena presa, um trilho só de 120% de rolagem */
            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: raiz,
                start: "top top",
                /* de 120% para 180% de rolagem: o trilho é o mesmo, só que dá tempo de ler */
                end: "+=180%",
                scrub: 0.6,
                pin: quadro,
                pinSpacing: true,
                anticipatePin: 1,
                /* ORDEM DE MEDIÇÃO. Quando há mais de uma cena presa na página, o ScrollTrigger
                   precisa remedir na ordem do documento, senão a seção 4 é medida com as
                   posições que a seção 3 ainda vai mudar, e as duas se sobrepõem. Prioridade
                   maior mede primeiro; esta é a seção 3, então vem antes da 4. */
                refreshPriority: 2,
                invalidateOnRefresh: true,
                onRefresh: desenharMoldura,
              },
            });
            fotosNaLinha(tl);
            textoNaLinha(tl, 0.12, 0.9);
          } else {
            /* mobile e telas baixas: sem pin, DOIS trilhos. As fotos e a linha seguem a passagem
               do próprio quadro (a terceira foto entra com o quadro ainda inteiro na tela); a
               lista e o botão seguem a passagem do texto. Pedido do Gabriel em 2026-09-10. */
            const texto = raiz.querySelector<HTMLElement>(".cena-texto");
            const tlFotos = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: caixa,
                start: "top 88%",
                /* fecha a moldura com o quadro ainda bem dentro da tela: em "bottom 38%" ela só
                   terminava quando a foto já estava saindo, e a Bruna nunca via o traço fechar */
                end: "bottom 62%",
                scrub: 0.6,
                invalidateOnRefresh: true,
                onRefresh: desenharMoldura,
              },
            });
            fotosNaLinha(tlFotos);
            const tlTexto = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: texto ?? raiz, start: "top 85%", end: "bottom 82%", scrub: 0.6 },
            });
            textoNaLinha(tlTexto, 0.05, 0.8);
          }

          /* Abrir o "Read more" muda a altura da cena presa, então o ScrollTrigger remede. E é
             aqui que a segunda placa entra: por cortina, de baixo para cima, com a foto vindo de
             um leve zoom. Mesmo verbo das fotos da seção 4. */
          const aoAbrir = () => {
            raiz.dataset.aberto = detalhes?.open ? "true" : "false";
            ScrollTrigger.refresh();
          };
          detalhes?.addEventListener("toggle", aoAbrir);
          return () => detalhes?.removeEventListener("toggle", aoAbrir);
        },
      );
    },
    { scope: secao },
  );

  return (
    <section id="inperson" className="secao secao-inperson" aria-labelledby={tituloId} ref={secao}>
      <div className="campo-pessego" data-camada="fundo" aria-hidden="true" />
      <div className="container cena-presencial" ref={cena}>
        <div className="cena-quadro" data-camada="frente">
          <div className="moldura" ref={moldura}>
            <svg className="moldura-svg" aria-hidden="true">
              <path ref={traco} className="moldura-traco" />
            </svg>
            <div className="cena-fotos">
              {fotos.map((f, i) => (
                <div key={f.src} className="cena-foto" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <Image src={f.src} alt={f.alt} fill quality={90} sizes="(min-width: 900px) 44vw, 100vw" />
                </div>
              ))}
            </div>
          </div>

          {/* A FAIXA ONDE ELA ANDA. O vão embaixo da foto é variável: encolhe com o texto
              fechado e cresce quando a pessoa abre o "Read more". Em vez de virar buraco, ele
              virou o chão de uma cena pequena. */}
          <div className="cena-chao">
            {/* A figura atravessa a faixa embaixo da foto, nos DOIS aparelhos. No desktop o vão
                é variável (cresce quando a pessoa abre o "Read more") e ela atravessa qualquer
                largura; no celular a faixa tem altura própria. */}
            <FiguraAndando />
          </div>
        </div>

        <div className="cena-texto" data-camada="meio">
          <h2 id={tituloId}>
            <Inteiras texto={titulo} />
          </h2>
          <p className="corpo-grande">{short}</p>

          {/* A INVERSÃO DE 2026-09-23. Antes eram estes dois parágrafos que ficavam atrás do
              "Read more" e a lista de serviços que ficava à vista. A Bruna pediu o contrário, e
              ela tem razão: o que convence alguém a continuar lendo é a frase sobre como o
              pós-parto é, não um inventário de tarefas. A lista é o detalhe de quem já se
              interessou, e por isso agora é ela que mora atrás do botão. */}
          <p className="cena-paragrafo">{p1}</p>
          <p className="cena-paragrafo">{p2}</p>

          <details className="mais">
            <summary>
              <span>{more}</span>
              <span className="acordeao-indicador" aria-hidden="true" />
              {/* No celular ela anda no ar livre à direita do "Read more", e atravessa a borda
                  da tela: some do lado de fora, vira lá e volta andando. É o que dá motivo
                  àquele espaço em branco em vez de ele ser só sobra. */}
              <FiguraAndando className="figura-no-mais" />
            </summary>
            <ul className="lista cena-lista">
              {bullets.map((b) => (
                <li key={b}>
                  <Inteiras texto={b} />
                </li>
              ))}
            </ul>
            {/* O PREÇO SAIU DA LISTA. Ela perguntou se ficava melhor no topo ou no fim, e o fim
                é o lugar certo: preço lido antes do serviço vira objeção, e preço no MEIO de uma
                lista de serviços lê como se fosse mais um serviço. Aqui ele fecha a leitura. */}
            <p className="cena-preco">{price}</p>
          </details>

          <a href={ctaHref} className="botao cena-cta">
            {cta}
          </a>

        </div>
      </div>
    </section>
  );
}
