"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * A ENTRADA DE UM CARD, quando ele APARECE NA TELA (IntersectionObserver do Motion), uma vez.
 *
 * Substitui o lote do ScrollTrigger (2026-09-23): o lote escondia todos os cards no começo e
 * esperava posições calculadas na montagem. Com o filtro reorganizando a grade, ou depois de uma
 * troca de página, as posições ficavam velhas e o card nunca aparecia (o Gabriel viu a grade vazia
 * no filtro "You are seen"). Aparecer na tela não fica velho.
 */
export function EntraNaVista({ children }: { children: ReactNode }) {
  const reduzido = useReducedMotion();
  return (
    <motion.div
      className="entra-na-vista"
      initial={reduzido ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
