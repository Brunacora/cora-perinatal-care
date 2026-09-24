"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Inteiras } from "../Enfase";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Degrau = {
  nome: string;
  preco: string;
  texto: string;
  itens: string[];
};

/**
 * Seção 5, os pacotes: "a escada" (autoral, GSAP; 2026-09-11).
 *
 * A FORMA VEM DO CONTEÚDO, não de um cartão de preço de catálogo. Lendo a copy da cliente, os
 * três pacotes são uma ESCADA: cada um contém tudo o que o anterior tem e acrescenta horas,
 * encapsulamento e o fechamento dos ossos. Por isso as três colunas se alinham pelo PÉ e não
 * pelo topo: quem tem mais linhas começa mais alto, e o olho sobe a escada da esquerda para a
 * direita, que é exatamente a decisão que a pessoa está tomando aqui.
 *
 * A CONTA DA COPY, feita antes de escolher a mecânica: cerca de 1.200 caracteres, um terço da
 * seção 4. Logo, isto NÃO pede cena presa. E não poderia pedir: as seções 3 e 4 já são duas
 * cenas presas seguidas, e uma terceira cansaria o corpo do site. Esta seção é VALE: rolagem
 * normal, movimento a serviço da leitura.
 *
 * O movimento reusa verbos já aprovados, para o site ler como um organismo e não como uma
 * coleção de truques: o campo pêssego SOBE (o mesmo verbo da seção 3), as divisórias da marca se
 * DESENHAM de cima para baixo, o preço sobe por baixo de uma máscara e a lista do pacote acende
 * item a item.
 *
 * Sem caixa, sem sombra, sem selo de "mais popular": a cliente não indicou pacote recomendado, e
 * inventar isso seria tática de funil num site de Modo A.
 * Reduced-motion: tudo no estado final. Posse: GSAP.
 */
export function CenaPacotes({
  rotulo,
  nota,
  fecho,
  degraus,
}: {
  /** o nome da seção para o leitor de tela (ela não tem título visível), no idioma da página */
  rotulo: string;
  nota: string;
  fecho: ReactNode;
  degraus: Degrau[];
}) {
  const secao = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const raiz = secao.current;
      if (!raiz) return;

      const campo = raiz.querySelector<HTMLElement>(".escada-campo");
      const divisorias = gsap.utils.toArray<HTMLElement>(".escada-divisoria span", raiz);
      const colunas = gsap.utils.toArray<HTMLElement>(".degrau", raiz);
      const elNota = raiz.querySelector<HTMLElement>(".escada-nota");
      const elFecho = raiz.querySelector<HTMLElement>(".escada-fecho");

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
          estreito: "(max-width: 899px)",
        },
        (ctx) => {
          const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };

          const cabecas = gsap.utils.toArray<HTMLElement>(".degrau-mask > *", raiz);
          const textos = gsap.utils.toArray<HTMLElement>(".degrau-texto", raiz);
          const itens = gsap.utils.toArray<HTMLElement>(".degrau-lista li", raiz);

          if (!anima) {
            if (campo) gsap.set(campo, { scaleY: 1 });
            gsap.set(divisorias, { scaleY: 1 });
            gsap.set([...cabecas, ...textos, ...itens], { opacity: 1, yPercent: 0, y: 0 });
            if (elNota) gsap.set(elNota, { opacity: 1 });
            if (elFecho) gsap.set(elFecho, { opacity: 1, y: 0 });
            return;
          }

          /* 1. O CAMPO SOBE e entrega a seção. Mesmo verbo da seção 3, e é o que faz esta seção
                pertencer ao mesmo site em vez de parecer um bloco importado. */
          if (campo) {
            gsap.fromTo(
              campo,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: "none",
                transformOrigin: "50% 100%",
                scrollTrigger: {
                  trigger: raiz,
                  start: "top 96%",
                  end: "top 42%",
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                },
              },
            );
          }

          /* 2. A escada se escreve: divisórias, cabeça, texto e itens, coluna por coluna. */
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: raiz,
              start: estreito ? "top 78%" : "top 66%",
              end: estreito ? "bottom 72%" : "bottom 88%",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          });

          if (elNota) tl.fromTo(elNota, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);

          /* as divisórias da marca descem entre as colunas, uma atrás da outra */
          gsap.set(divisorias, { transformOrigin: "50% 0%" });
          tl.fromTo(
            divisorias,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.9, stagger: 0.18, ease: "none" },
            0.1,
          );

          colunas.forEach((col, i) => {
            const quando = 0.2 + i * 0.34;
            const cabeca = gsap.utils.toArray<HTMLElement>(".degrau-mask > *", col);
            const texto = col.querySelector<HTMLElement>(".degrau-texto");
            const lista = gsap.utils.toArray<HTMLElement>(".degrau-lista li", col);

            /* o nome e o preço sobem por baixo de uma máscara: a mesma caligrafia do nome das
               aulas na seção 4 */
            tl.fromTo(
              cabeca,
              { yPercent: 108, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.08 },
              quando,
            );
            if (texto) {
              tl.fromTo(texto, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, quando + 0.14);
            }
            /* os itens são inline-block dentro de uma linha própria: só opacidade e um passo
               curto, para a leitura não saltar */
            tl.fromTo(
              lista,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 },
              quando + 0.24,
            );
          });

          if (elFecho) {
            tl.fromTo(elFecho, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, ">-0.2");
          }
        },
      );
    },
    { scope: secao },
  );

  return (
    <section id="packages" className="secao secao-pacotes" aria-labelledby="pacotes-titulo" ref={secao}>
      {/* o campo de cor sobe e entrega a seção */}
      <div className="campo-pessego escada-campo" aria-hidden="true" />

      <div className="container escada">
        {/* O TÍTULO VISÍVEL, a partir de 2026-09-23. Até aqui `rotulo` era só `aria-label`: a
            seção não tinha cabeçalho nenhum na tela, e a Bruna perguntou, com razão, se dava para
            dizer que aquela parte fala de pacotes. Era também um buraco de estrutura, porque uma
            seção sem heading não entra no índice do documento. */}
        <h2 id="pacotes-titulo" className="escada-titulo">
          {rotulo}
        </h2>

        {/* A NOTA DA TAXA DE VIAGEM SOBE PARA CÁ (pedido da Bruna, nas duas revisões). No pé, ela
            ficava alinhada embaixo da PRIMEIRA coluna e dava a impressão de valer só para o
            Bloom. Sob o título, ela qualifica os três de uma vez. A ressalva antiga, de que abrir
            a seção com uma taxa é pouco convidativo, continua verdadeira: por isso quem abre a
            seção é o título, e a nota entra pequena, depois dele. */}
        <p className="texto-apoio escada-nota">{nota}</p>

        <div className="escada-grade">
          {/* as duas divisórias da marca, desenhadas pela rolagem */}
          <div className="escada-divisoria escada-divisoria-1" aria-hidden="true">
            <span />
          </div>
          <div className="escada-divisoria escada-divisoria-2" aria-hidden="true">
            <span />
          </div>

          {degraus.map((d) => (
            <article key={d.nome} className="degrau">
              <h3 className="degrau-cabeca">
                {/* uma caixa de recorte por linha: é o que faz o texto subir POR BAIXO de uma
                    máscara em vez de apenas deslizar */}
                <span className="degrau-mask">
                  <span className="degrau-nome">{d.nome}</span>
                </span>
                <span className="degrau-mask">
                  <span className="degrau-preco display">{d.preco}</span>
                </span>
              </h3>
              <p className="degrau-texto">{d.texto}</p>
              <ul className="degrau-lista">
                {d.itens.map((it) => (
                  <li key={it}>
                    <Inteiras texto={it} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="corpo-grande escada-fecho">{fecho}</p>
      </div>
    </section>
  );
}
