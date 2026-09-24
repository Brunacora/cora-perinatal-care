"use client";

import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/cn";

type MenuToggleProps = ComponentProps<"svg"> & {
  open: boolean;
  duration?: number;
};

/**
 * Menu Toggle Icon (21st.dev 8718, efferd), adaptado para a Cora (Passe 2, 2026-09-11).
 *
 * O traço de cima do hambúrguer se enrola e vira o X: é UMA linha que dá a volta e se fecha, o
 * mesmo gesto da logo. A animação é a do autor, inteira (traço tracejado que corre e a rotação de
 * 45 graus, 500ms).
 *
 * Passada de tokens: traço de 1,5 (o peso de linha da marca), cor herdada (tinta), as utilitárias
 * do Tailwind viraram classes do projeto (`.menu-toggle*`), e com prefers-reduced-motion a troca é
 * imediata (CSS).
 */
export function MenuToggleIcon({
  open,
  className,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 1.5,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  duration = 500,
  style,
  ...props
}: MenuToggleProps) {
  return (
    <svg
      strokeWidth={strokeWidth}
      fill={fill}
      stroke={stroke}
      viewBox="0 0 32 32"
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={cn("menu-toggle", open && "menu-toggle-aberto", className)}
      style={{ "--menu-toggle-duracao": `${duration}ms`, ...style } as CSSProperties}
      {...props}
    >
      <path
        className="menu-toggle-traco"
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}
