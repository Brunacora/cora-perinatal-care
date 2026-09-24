"use client";

import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@/lib/cn";

/**
 * Drawer (21st.dev 11444, coss.com), adaptado para a Cora (Passe 2, 2026-09-11).
 *
 * O painel que desliza da borda, com o gesto de ARRASTAR para fechar, é o que a Bruna apontou no
 * site do Holistic Birth & Beyond. Por baixo é a gaveta da Base UI: diálogo de verdade (foco preso
 * dentro, Esc fecha, toque fora fecha, rolagem da página travada) e o arrasto com velocidade.
 *
 * O que ficou do original: a Root com a direção do arrasto, o fundo cuja opacidade segue o arrasto
 * (`--drawer-swipe-progress`), o painel que acompanha o dedo (`--drawer-swipe-movement-x`) e a
 * curva do autor (450ms, cubic-bezier(0.32, 0.72, 0, 1)).
 *
 * O que saiu, e por quê: o botão interno com `class-variance-authority` e os ícones do
 * `lucide-react` (a marca usa uma família de ícones só, e aqui o X é o próprio Menu Toggle Icon),
 * as posições de cima, de baixo e da direita, as gavetas aninhadas e os itens de menu com caixa de
 * seleção. A Cora usa uma gaveta, pela esquerda. As classes do shadcn viraram classes do projeto
 * (`.gaveta-*`), com os tokens do design.md.
 *
 * Um acréscimo: durante o arrasto o painel não tem transição, senão ele segue o dedo com 450ms de
 * atraso.
 */

export function Drawer({
  open,
  onOpenChange,
  onOpenChangeComplete,
  children,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onOpenChangeComplete?: (aberto: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(aberto) => onOpenChange(aberto)}
      onOpenChangeComplete={onOpenChangeComplete}
      swipeDirection="left"
    >
      {children}
    </DrawerPrimitive.Root>
  );
}

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;
export const DrawerTitle = DrawerPrimitive.Title;

export function DrawerPopup({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop className="gaveta-veu" />
      <DrawerPrimitive.Viewport className="gaveta-janela">
        <DrawerPrimitive.Popup className={cn("gaveta-painel", className)}>{children}</DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}
