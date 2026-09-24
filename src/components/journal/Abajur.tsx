"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * O MODO ABAJUR (design-blog.md, 5.5): a mesma marca com a luz apagada, para quem lê no escuro às
 * três da manhã. O site inteiro é travado em tema claro (`only light`) para o navegador não inverter
 * a marca; aqui é a LEITORA que escolhe baixar a luz, e só na página do artigo.
 *
 * Origem: 21st.dev, "Light Pull Theme Switcher" de oldkong88 (demo 1789). Veio dele o gesto: um
 * cordão com uma conta na ponta, que se PUXA para baixo, com mola na volta (`drag="y"` preso em
 * zero, elástico curto). Mudou, e era obrigatório: o original só tinha arrasto, sem clique, sem
 * teclado e sem rótulo. Aqui é um `<button>` com `aria-pressed`, alvo de 44px, que também acende e
 * apaga com um toque ou com Enter; o puxão é o jeito bonito, não o único. A conta amarela com brilho
 * virou tinta da marca (conta vazada acesa, cheia apagada), e o `classList.toggle("dark")` virou o
 * `data-luz` que o `journal.css` lê.
 *
 * Página original: https://21st.dev/@oldkong88/components/light-pull-theme-switcher
 */
const CHAVE = "cora-luz";

/* A escolha mora no aparelho (localStorage) e é lida como loja externa: no servidor a luz está
   sempre acesa, e no navegador vale o que ficou guardado, sem efeito que acenda e apague. */
const ouvintes = new Set<() => void>();
/* sem armazenamento (navegação privada), a escolha vale só enquanto a página está aberta */
let naMemoria = false;
function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}
function lerLuz() {
  try {
    return window.localStorage.getItem(CHAVE) === "abajur";
  } catch {
    return naMemoria;
  }
}

/** O script que acende o abajur ANTES da primeira pintura, para quem já escolheu não ver o clarão. */
export const SCRIPT_DO_ABAJUR = `try{if(localStorage.getItem("${CHAVE}")==="abajur")document.documentElement.dataset.luz="abajur"}catch(e){}`;

export function Abajur({ rotulo, dica }: { rotulo: string; dica: string }) {
  const apagada = useSyncExternalStore(assinar, lerLuz, () => false);
  const reduzido = useReducedMotion();
  /* um puxão também dispara o clique ao soltar: o clique que vem logo depois é ignorado */
  const puxou = useRef(false);

  useEffect(() => {
    const raiz = document.documentElement;
    if (apagada) raiz.dataset.luz = "abajur";
    else delete raiz.dataset.luz;
    return () => {
      delete raiz.dataset.luz;
    };
  }, [apagada]);

  const alternar = () => {
    try {
      if (lerLuz()) window.localStorage.removeItem(CHAVE);
      else window.localStorage.setItem(CHAVE, "abajur");
    } catch {
      naMemoria = !naMemoria;
    }
    ouvintes.forEach((avisar) => avisar());
  };

  return (
    <motion.button
      type="button"
      className="abajur"
      aria-pressed={apagada}
      title={dica}
      onClick={() => {
        if (puxou.current) {
          puxou.current = false;
          return;
        }
        alternar();
      }}
      drag={reduzido ? false : "y"}
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.35 }}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 16 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 14) {
          puxou.current = true;
          alternar();
          /* se o soltar não gerar clique (fora do botão), a trava não pode ficar armada */
          window.setTimeout(() => {
            puxou.current = false;
          }, 400);
        }
      }}
    >
      <span className="abajur-cordao" aria-hidden="true">
        <span className="abajur-fio" />
        <span className="abajur-conta" />
      </span>
      <span className="abajur-rotulo">{rotulo}</span>
    </motion.button>
  );
}
