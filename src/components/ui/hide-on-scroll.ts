"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hide On Scroll (21st.dev 23532, ddoemonn), adaptado para a Cora (Passe 2, 2026-09-11).
 *
 * O componente do catálogo é uma caixa de rolagem de demonstração com uma barra por cima. O que
 * serve ao site é o GANCHO dele: a barra sai ao descer e volta ao subir, com folga para não piscar
 * (acumula 14px descendo para esconder, 10px subindo para mostrar) e uma guarda no topo (24px, onde
 * ela fica sempre). `pinned` segura a barra à vista (foco de teclado dentro dela, menu aberto).
 *
 * Adaptação: só a janela (a página inteira), sem a caixa de rolagem da demonstração. As duas molas
 * do componente vêm junto, sem mudança, e quem as usa é a Navbar (Motion, dono do estado da barra).
 *
 * Página original: https://21st.dev/@ddoemonn/components/hide-on-scroll
 */
export const DISCLOSE = { type: "spring", stiffness: 150, damping: 27, mass: 1 } as const;
export const CROSSFADE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;

export function useHideOnScroll({
  hideAfter = 14,
  revealAfter = 10,
  topGuard = 24,
  pinned = false,
}: {
  hideAfter?: number;
  revealAfter?: number;
  topGuard?: number;
  pinned?: boolean;
} = {}) {
  const frame = useRef(0);
  const last = useRef(0);
  const accum = useRef(0);
  const held = useRef(pinned);

  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const down = Math.max(1, hideAfter);
  const up = Math.max(1, revealAfter);
  const guard = Math.max(0, topGuard);

  /* Adaptação às regras do React atual: o original gravava a ref durante a renderização e zerava o
     estado dentro de um efeito. Aqui a ref é gravada no efeito, e "segurar à vista" DERIVA a
     resposta (hidden && !pinned) em vez de mexer no estado. */
  useEffect(() => {
    held.current = pinned;
    if (pinned) accum.current = 0;
  }, [pinned]);

  useEffect(() => {
    const readMax = () => document.documentElement.scrollHeight - window.innerHeight;

    const evaluate = () => {
      frame.current = 0;
      const max = readMax();
      const y = window.scrollY;

      if (max <= guard) {
        accum.current = 0;
        last.current = y;
        setAtTop((prev) => (prev ? prev : true));
        setHidden((prev) => (prev ? false : prev));
        return;
      }

      /* o elástico do iOS passa das pontas: não conta como rolagem */
      if (y < 0 || y > max) return;

      const dy = y - last.current;
      last.current = y;

      const top = y <= guard;
      setAtTop((prev) => (prev === top ? prev : top));

      if (held.current || top) {
        accum.current = 0;
        setHidden((prev) => (prev ? false : prev));
        return;
      }

      if (dy === 0) return;
      if (dy > 0 !== accum.current > 0) accum.current = 0;
      accum.current += dy;

      if (accum.current >= down) {
        accum.current = 0;
        setHidden((prev) => (prev ? prev : true));
      } else if (accum.current <= -up) {
        accum.current = 0;
        setHidden((prev) => (prev ? false : prev));
      }
    };

    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(evaluate);
    };

    last.current = window.scrollY;
    evaluate();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [down, up, guard]);

  return { hidden: hidden && !pinned, atTop };
}
