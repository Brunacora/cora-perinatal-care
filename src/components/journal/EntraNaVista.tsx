"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { assinarLeituras, estadoDaLeitura, progressoDe } from "@/lib/leituras";

/**
 * O CARD VIVO (movimento-blog.md, seção 9). Três camadas, três donos, nenhuma briga:
 *
 * 1. `.entra-na-vista` (Motion): a ENTRADA, quando o card aparece na tela, uma vez. Aparecer na tela
 *    não fica velho (o lote do ScrollTrigger ficava, e o card sumia depois de filtrar ou de trocar de
 *    página).
 * 2. `.card-vivo` (Motion, ligado à rolagem): o ATRASO da coluna da direita no desktop, e as
 *    variáveis que movem a CAPA.
 * 3. A capa (CSS, lendo as variáveis): chega inclinada para a frente, assenta plana no meio da tela e
 *    se inclina para trás ao sair.
 *
 * Origem: 21st.dev, "ScrollTiltedGrid" de ruixen.ui (demo 12434). Veio dele o gesto (a capa sobe
 * inclinada, assenta no foco e se inclina ao sair, com a curva de entrada e de saída dele). Mudou: só a
 * CAPA se move (o texto do card fica parado e legível), sem o desfoque e o brilho animados (pesam no
 * celular e sujam o papel), 16° em vez de 70°, e as variáveis de CSS no lugar de estilo direto, porque o
 * card chega pronto do servidor.
 *
 * O CADERNO QUE LEMBRA (2026-09-24): com o `slug`, o card sabe até onde a leitora leu aquele artigo
 * NESTE aparelho (`lib/leituras.ts`) e escreve `data-lido` ("meio" ou "fim") e `--lido` (0 a 1). O
 * CSS mostra o fio de tinta sob a capa, o arco que se fecha no lido, e troca a linha do tempo.
 *
 * Página original: https://21st.dev/@ruixen.ui/components/scroll-tilted-grid
 */

type Props = { children: ReactNode; lado?: "esquerda" | "direita"; slug?: string };

function useCapaViva(p: MotionValue<number>, lado: "esquerda" | "direita") {
  const sinal = lado === "esquerda" ? -1 : 1;
  const rx = useTransform(p, [0, 0.5, 1], [16, 0, -10]);
  const ry = useTransform(p, [0, 0.5, 1], [sinal * 6, 0, -sinal * 3]);
  const x = useTransform(p, [0, 0.5, 1], [sinal * 6, 0, sinal * 3]);
  const s = useTransform(p, [0, 0.5, 1], [0.9, 1, 0.97]);
  const frase = useTransform(p, [0, 1], [18, -18]);
  /* o desenho da capa se FORMA enquanto ela chega, e fica pronto quando ela assenta no meio */
  const traco = useTransform(p, [0.08, 0.48], [0, 1], { clamp: true });
  return { rx, ry, x, s, frase, traco };
}

export function EntraNaVista({ children, lado = "esquerda", slug }: Props) {
  const lido = useSyncExternalStore(
    assinarLeituras,
    () => (slug ? progressoDe(slug) : 0),
    () => 0,
  );
  const estado = estadoDaLeitura(lido);
  const reduzido = useReducedMotion();
  const alvo = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: alvo, offset: ["start end", "end start"] });
  const capa = useCapaViva(scrollYProgress, lado);
  /* a coluna da direita anda com atraso da esquerda (só do tablet para cima: no celular é uma coluna) */
  const atraso = useTransform(scrollYProgress, [0, 1], lado === "direita" ? [56, -56] : [0, 0]);

  return (
    <motion.div
      className="entra-na-vista"
      initial={reduzido ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={alvo}
        className="card-vivo"
        data-lado={lado}
        data-lido={estado || undefined}
        style={
          reduzido
            ? ({ "--lido": lido } as React.CSSProperties)
            : ({
                "--lido": lido,
                "--capa-rx": capa.rx,
                "--capa-ry": capa.ry,
                "--capa-x": capa.x,
                "--capa-s": capa.s,
                "--capa-frase": capa.frase,
                "--capa-traco": capa.traco,
                "--card-atraso": atraso,
              } as unknown as React.CSSProperties)
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
