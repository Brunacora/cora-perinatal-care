"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/* O ESTADO INICIAL, escrito à mão e igual ao primeiro ponto da animação. Ver a nota do componente:
   é ele que o servidor e o cliente renderizam na primeira passada, para os dois concordarem. */
const RECORTE_INICIAL =
  "inset(26% round var(--radius-arco) var(--radius-arco) var(--radius-card) var(--radius-card))";

/**
 * Reveal Image Mask (21st.dev, 10905, daiwiikharihar), adaptado à Cora.
 * A foto "floresce" de uma forma contida para o quadro inteiro, ligada ao progresso da rolagem.
 * Nível 1 (tokens): raio do arco-linha (999px em cima, --radius-card embaixo), sem caixa, sem
 * título e legenda internos (a copy é da seção). Nível 2 (proposto e aprovado no conceito da
 * hero v4): a forma da máscara é o ARCO da logo o tempo todo; o que muda é o inset, então a foto
 * cresce dentro do arco desenhado, que fica por cima. É aqui que o desenho vira foto.
 * Posse do movimento: Motion (veio no componente). O GSAP não toca neste elemento no Passe 3.
 * Reduced-motion: foto no lugar final, sem máscara.
 *
 * ERRO DE HIDRATAÇÃO, CONSERTADO EM 2026-09-23. O estilo era decidido por `useReducedMotion()`
 * DURANTE A RENDERIZAÇÃO, e esse valor não é o mesmo no servidor e no cliente: o React acusava
 * "hydration failed" em TODA página, nos dois idiomas, e jogava fora esta árvore para refazê-la no
 * cliente. É a mesma família do defeito que fazia o provider remontar a página inteira (a nota
 * `2026-09-14-movimento-provider-do-acervo-remonta-a-pagina`), e a regra de lá vale aqui: nunca
 * decida na renderização um valor que muda entre o servidor e o cliente.
 *
 * A cura sem piscada: as duas passadas renderizam o MESMO recorte inicial, escrito à mão, e o
 * valor animado só assume depois de montado. Como ele começa exatamente em 26%, a troca é
 * invisível.
 */
export function RevealImageMask({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduzido = useReducedMotion();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "center 55%"] });
  const progresso = useSpring(scrollYProgress, { stiffness: 170, damping: 24, mass: 0.95 });
  const inset = useTransform(progresso, [0, 1], ["26%", "0%"]);
  const clipPath = useTransform(
    inset,
    (i) => `inset(${i} round var(--radius-arco) var(--radius-arco) var(--radius-card) var(--radius-card))`,
  );

  return (
    <motion.div
      ref={ref}
      className={`revelacao-arco ${className}`}
      style={
        !montado
          ? { clipPath: RECORTE_INICIAL, willChange: "clip-path" }
          : reduzido
            ? undefined
            : { clipPath, willChange: "clip-path" }
      }
    >
      {children}
    </motion.div>
  );
}
