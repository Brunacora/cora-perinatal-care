"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** 8 poses numa folha de 1024x256: cada quadro tem 1/8 da largura. */
const QUADROS = 8;
/** duração de um ciclo completo de passada (duas passadas) */
const CICLO = 0.88;

/**
 * A FIGURA QUE ANDA. A mulher carregando o bebê, no traço da marca, atravessando devagar,
 * virando e voltando.
 *
 * COMO ELA ANDA: a folha tem oito poses e a janela mostra UMA. A folha salta de quadro em quadro
 * atrás dela. É animação de jogo 2D, e é o que faz as pernas se moverem em vez de a imagem
 * escorregar.
 *
 * POR QUE O CICLO É DIRIGIDO PELO RELÓGIO E NÃO POR UM TWEEN (versão 2, 2026-09-11): a versão
 * anterior usava um tween com ease "steps" que a travessia PAUSAVA e RETOMAVA na virada. Dois
 * problemas nasceram daí. Primeiro, qualquer falha nesse pausar e retomar deixava a figura
 * deslizando numa pose só, que foi o que o Gabriel viu no desktop. Segundo, o tween terminava
 * exatamente em -8 quadros, que é um pedaço VAZIO da folha: por um instante a cada ciclo ela
 * sumia, e foi a piscada que ele viu no celular.
 * Aqui o quadro é calculado do relógio do GSAP com resto de divisão. Não há estado para
 * quebrar, o índice nunca sai de 0 a 7, e a largura é lida a cada quadro, então redimensionar
 * a janela não desalinha nada.
 *
 * NÃO EXISTE FOLHA ESPELHADA, e não precisa: para voltar, o quadro inteiro é espelhado. O que
 * nunca se espelha é a LOGO, que é marca; ilustração pode.
 *
 * A VELOCIDADE É CALCULADA a partir da altura dela: se a travessia for mais rápida do que a
 * passada cobre, o pé patina, e o olho percebe na hora mesmo sem saber explicar.
 *
 * Reduced-motion: parada, numa pose só.
 */
export function FiguraAndando({
  className = "",
  dirigida = false,
}: {
  className?: string;
  /**
   * `false` (padrao): ela atravessa sozinha, de ida e volta, no proprio ritmo.
   * `true`: quem manda na posicao e QUEM CHAMA, movendo `.figura-janela` no eixo x. Aqui a
   * passada nao vem do relogio, vem da DISTANCIA percorrida: ela so da um passo quando anda de
   * verdade, e para de pe quando a rolagem para. E a diferenca entre uma figura que caminha e
   * uma figura que patina no lugar.
   */
  dirigida?: boolean;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const faixa = caixa.current;
      const janela = faixa?.querySelector<HTMLElement>(".figura-janela");
      const folha = faixa?.querySelector<HTMLElement>(".figura-folha");
      if (!faixa || !janela || !folha) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (dirigida) {
          /* a passada medida em distancia: uma passada cobre pouco mais de meia largura dela */
          const passo = () => {
            const w = janela.clientWidth;
            if (!w) return;
            const x = (gsap.getProperty(janela, "x") as number) || 0;
            const passada = Math.max(8, w * 0.62);
            const i = Math.floor(Math.abs(x) / passada) % QUADROS;
            gsap.set(folha, { x: -i * w });
          };
          gsap.ticker.add(passo);
          return () => gsap.ticker.remove(passo);
        }

        /* o ciclo de passada, direto do relógio: sem tween, sem pausa, sem quadro vazio */
        const passo = () => {
          const w = janela.clientWidth;
          if (!w) return;
          const i = Math.floor((gsap.ticker.time / CICLO) * QUADROS) % QUADROS;
          gsap.set(folha, { x: -i * w });
        };
        gsap.ticker.add(passo);

        /* a travessia, e a virada com o espelhamento passando por zero */
        const percurso = () => Math.max(0, faixa.clientWidth - janela.clientWidth);
        const tempo = () => percurso() / Math.max(28, janela.clientHeight * 0.9);

        const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
        tl.to(janela, { x: percurso, duration: tempo })
          .to(janela, { scaleX: -1, duration: 0.5, ease: "power1.inOut" })
          .to(janela, { x: 0, duration: tempo })
          .to(janela, { scaleX: 1, duration: 0.5, ease: "power1.inOut" });

        return () => {
          gsap.ticker.remove(passo);
          tl.kill();
        };
      });
    },
    { scope: caixa, dependencies: [dirigida] },
  );

  return (
    <div className={`figura-faixa ${className}`} ref={caixa} aria-hidden="true">
      <div className="figura-janela">
        {/* A folha do sprite é decorativa e vive fora da tela até a seção chegar: carrega tarde e
            decodifica fora da linha principal, que é o que o aparelho fraco agradece. Fica em
            <img> porque é uma tira de oito quadros que o GSAP desloca; passar pelo otimizador não
            ajudaria e mudaria a medida do passo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="figura-folha"
          src="/fotos/figura-andando.png"
          alt=""
          width={1024}
          height={256}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
