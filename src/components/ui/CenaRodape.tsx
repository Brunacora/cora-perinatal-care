"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * PICO 3, o rodapé: "o campo sobe e a página assenta" (autoral, GSAP; Passe 2, 2026-09-11).
 *
 * É a segunda e última vez que um campo de cor sobe no site (a primeira é o pêssego da seção 3), e
 * é a maior: a terracota sobe da base da tela em scrub e VIRA o rodapé inteiro. O campo mora dentro
 * do rodapé, porque a fronteira é da seção de baixo, e sobe por translateY com a borda de cima em
 * ARCO: uma curva só, o arco da logo, não uma onda desenhada (movimento.md, seção 6).
 *
 * A cena, toda ligada à rolagem:
 *   1. o campo sobe ao longo de 80vh de rolagem, mais depressa que a página, e assenta no topo do
 *      rodapé. Ele parte meia tela abaixo do lugar (45% no celular). MEDIDO: partindo de 80% da tela,
 *      a folha do formulário entrava na tela sobre o papel nu, antes de a terracota chegar atrás
 *      dela, e o texto dela boiava solto embaixo dos depoimentos. Com meia tela, o campo cobre o
 *      lugar da folha antes de ela aparecer, e a subida continua visível (a borda anda 1,6 vez mais
 *      depressa que a página);
 *   2. o título entra linha a linha, em papel sobre tinta, e SÓ depois que o campo está atrás
 *      dele: antes disso seria papel sobre papel, texto invisível. Por isso quem dispara o título é
 *      o progresso do campo, e não a posição do título;
 *   3. a folha de papel com o formulário (frente) sobe 10vh sobre o campo (fundo); 5vh no celular.
 *      O gatilho é o LUGAR da folha, que não se move: medir o próprio elemento que sobe desloca a
 *      régua a cada remedida;
 *   4. o símbolo da logo se desenha pela segunda vez no site, de cima para baixo, na mão de quem
 *      rola (na hero ele se desenha sozinho, uma vez, no carregamento). No desktop ele fica preso
 *      no meio da tela e acompanha a leitura do formulário, como as borboletas da seção 9;
 *   5. o cartão de contatos entra uma vez, como os parágrafos de corpo do site.
 *
 * Posse: o GSAP é dono de tudo aqui MENOS do formulário, que é do Motion. A folha que sobe é a
 * caixa do formulário, nunca os campos dele.
 *
 * O campo começa ABAIXO do rodapé; o `overflow: clip` do rodapé impede que ele estique a página
 * (e, ao contrário de `hidden`, não quebra o sticky do símbolo). As condições do matchMedia são
 * EXAUSTIVAS (lição da seção 6). Reduced-motion: tudo no estado final.
 */
export function CenaRodape({ tituloId, children }: { tituloId: string; children: ReactNode }) {
  const raiz = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = raiz.current;
      if (!el) return;

      const campo = el.querySelector<HTMLElement>(".campo-tinta");
      const titulo = el.querySelector<HTMLElement>(".rodape-titulo");
      const lugar = el.querySelector<HTMLElement>(".folha-lugar");
      const folha = el.querySelector<HTMLElement>(".folha");
      const marca = el.querySelector<HTMLElement>(".rodape-marca");
      /* a caixa do símbolo, com o SVG (pôster) e o volume dentro: o desenho de cima para baixo vale
         para os dois */
      const simbolo = el.querySelector<HTMLElement>(".rodape-marca .rodape-simbolo");
      const cartao = el.querySelector<HTMLElement>(".rodape-cartao");

      const corte = titulo
        ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras: com o padrão
             o SplitText troca todos por espaço comum antes de medir, e a 1024px "alone." ficava
             sozinho na última linha */
          new SplitText(titulo, { type: "lines", linesClass: "rodape-linha", mask: "lines", reduceWhiteSpace: false })
        : null;

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
          largo: "(min-width: 1024px)",
        },
        (ctx) => {
          const { anima, largo } = ctx.conditions as { anima: boolean; largo: boolean };

          if (!anima) {
            if (campo) gsap.set(campo, { y: 0 });
            if (corte) gsap.set(corte.lines, { yPercent: 0, opacity: 1 });
            if (folha) gsap.set(folha, { y: 0 });
            if (simbolo) gsap.set(simbolo, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 });
            if (cartao) gsap.set(cartao, { opacity: 1, y: 0 });
            return;
          }

          /* 2. o título espera o campo */
          const entrada = gsap.timeline({ paused: true });
          if (corte && corte.lines.length) {
            entrada.fromTo(
              corte.lines,
              { yPercent: 106, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.62, stagger: 0.09, ease: "power3.out" },
            );
          }
          /* Com folga entre subir e descer (entra acima de 0,9, sai abaixo de 0,82): quem rola de
             volta para cima vê o título recolher antes de o campo descer por trás dele. Sem isso, o
             título em papel ficava FATIADO pela borda do arco na volta (medido no celular): a parte
             sobre a tinta aparecia e a parte sobre o papel sumia. Aos 0,82 o campo ainda cobre o
             título nas duas larguras. */
          const alternar = (progresso: number) => {
            if (progresso > 0.9) entrada.timeScale(1).play();
            else if (progresso < 0.82) entrada.timeScale(1.6).reverse();
          };

          /* 1. o campo sobe */
          if (campo) {
            gsap.fromTo(
              campo,
              { y: () => Math.min(window.innerHeight * (largo ? 0.5 : 0.45), el.offsetHeight) },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top bottom",
                  end: "top 20%",
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                  onUpdate: (st) => alternar(st.progress),
                  /* quem chega pelo botão (#form) já encontra o campo no lugar */
                  onRefresh: (st) => alternar(st.progress),
                },
              },
            );
          } else {
            entrada.play();
          }

          /* 3. a folha sobe sobre o campo */
          if (lugar && folha) {
            gsap.fromTo(
              folha,
              { y: () => window.innerHeight * (largo ? 0.1 : 0.05) },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: lugar,
                  start: "top bottom",
                  end: "top 35%",
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                },
              },
            );
          }

          /* 4. o símbolo se desenha na mão de quem rola. No celular, `clamp()` garante que o fim do
             trecho cabe na página: o rodapé é o fim do site, e um fim inalcançável deixaria o
             símbolo desenhado pela metade para sempre. */
          if (marca && simbolo) {
            gsap.fromTo(
              simbolo,
              { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.2 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: marca,
                  start: "top 92%",
                  end: largo ? "top 30%" : "clamp(bottom 62%)",
                  scrub: 0.6,
                },
              },
            );
          }

          /* 5. o cartão entra uma vez */
          if (cartao) {
            gsap.fromTo(
              cartao,
              { opacity: 0, y: largo ? 24 : 16 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: { trigger: cartao, start: "top 90%", once: true },
              },
            );
          }
        },
      );

      return () => corte?.revert();
    },
    { scope: raiz },
  );

  return (
    <footer id="form" className="rodape" aria-labelledby={tituloId} ref={raiz}>
      {children}
    </footer>
  );
}
