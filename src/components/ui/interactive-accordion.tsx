"use client";

import { useId, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

/**
 * Interactive Accordion, do 21st.dev (id 9602, autor jatin-yadav05).
 * https://21st.dev/@jatin-yadav05/components/interactive-accordion
 * No original a exportação chamava `UniqueAccordion`.
 *
 * ENTROU COM A ANIMAÇÃO DELE, inteira: o disco do número que enche de tinta, a pergunta que anda
 * 4px, o mais que gira até virar X, a linha que se estende por baixo e a mola da abertura, com as
 * mesmas constantes de mola do autor.
 *
 * PASSADA DE TOKENS (nível 1, obrigatória): todas as cores do shadcn (`--foreground`,
 * `--muted-foreground`, `--primary-foreground`, `bg-border`) viraram tokens da Cora (`--ink`,
 * `--text`, `--text-muted`, `--text-on-ink`, `--hairline`), e as utilitárias do Tailwind viraram
 * classes do projeto no `globals.css`.
 *
 * TRÊS CORREÇÕES QUE NÃO SÃO GOSTO, SÃO OBRIGAÇÃO (e nenhuma muda o gesto):
 *   1. Import: `framer-motion` virou `motion/react`, que é o pacote que o projeto tem.
 *   2. Acessibilidade: o original punha um <h3> DENTRO do <button>, o que é HTML inválido (botão só
 *      aceita conteúdo de frase), e não tinha `aria-expanded` nem `aria-controls`. Aqui é o padrão
 *      correto de acordeão: o título envolve o botão, o botão diz se está aberto e aponta o painel.
 *   3. SEO: o original DESMONTAVA a resposta ao fechar (AnimatePresence), então o HTML entregue ao
 *      buscador tinha uma resposta das sete. No FAQ, que é a seção que mais responde às buscas de
 *      quem procura doula, isso é perda real. Aqui as sete respostas ficam sempre no DOM; fechadas,
 *      têm altura zero e `inert` (nada nelas recebe foco), e abrem com a MESMA mola do autor.
 *
 * Hover só com mouse de verdade: no toque o `mouseenter` do original grudava a linha de hover no
 * último item tocado. Teclado ganha o mesmo realce pelo foco.
 *
 * POSSE DO MOVIMENTO: Motion. O GSAP não toca nos elementos deste componente.
 * Reduced-motion: tudo sem mola, estado final direto.
 */

export interface ItemAcordeao {
  id: string;
  numero: string;
  pergunta: ReactNode;
  resposta: ReactNode;
}

export function InteractiveAccordion({
  itens,
  inicialAberto,
}: {
  itens: ItemAcordeao[];
  /** id do item que nasce aberto. Padrão do autor: o primeiro. `null` nasce tudo fechado. */
  inicialAberto?: string | null;
}) {
  const [activeId, setActiveId] = useState<string | null>(
    inicialAberto === undefined ? (itens[0]?.id ?? null) : inicialAberto,
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const reduzido = useReducedMotion();
  const base = useId();

  /* as molas são as do autor; com menos movimento pedido, viram corte seco */
  const mola = (stiffness: number, damping: number): Transition =>
    reduzido ? { duration: 0 } : { type: "spring", stiffness, damping };
  const fade = (duration: number, delay = 0): Transition =>
    reduzido ? { duration: 0 } : { duration, delay };

  return (
    <div className="ia">
      {itens.map((item) => {
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        const botaoId = `${base}-botao-${item.id}`;
        const painelId = `${base}-painel-${item.id}`;

        return (
          <div className="ia-item" key={item.id}>
            <h3 className="ia-cabeca">
              <motion.button
                type="button"
                id={botaoId}
                className="ia-botao"
                aria-expanded={isActive}
                aria-controls={painelId}
                initial={false}
                onClick={() => setActiveId(isActive ? null : item.id)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHoveredId(item.id);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setHoveredId(null);
                }}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId(null)}
              >
                {/* o número, com o disco que enche de tinta */}
                <span className="ia-numero-caixa" aria-hidden="true">
                  <motion.span
                    className="ia-disco"
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : isHovered ? 0.85 : 0,
                      opacity: isActive ? 1 : isHovered ? 0.12 : 0,
                    }}
                    transition={mola(400, 25)}
                  />
                  <motion.span
                    className="ia-numero"
                    initial={false}
                    animate={{ color: isActive ? "var(--text-on-ink)" : "var(--ink-letra)" }}
                    transition={fade(0.2)}
                  >
                    {item.numero}
                  </motion.span>
                </span>

                {/* a pergunta */}
                <motion.span
                  className="ia-pergunta"
                  initial={false}
                  animate={{
                    x: isActive || isHovered ? 4 : 0,
                    color: isActive || isHovered ? "var(--text)" : "var(--text-muted)",
                  }}
                  transition={mola(400, 30)}
                >
                  {item.pergunta}
                </motion.span>

                {/* o mais que gira até virar X */}
                <span className="ia-indicador-caixa" aria-hidden="true">
                  <motion.span
                    className="ia-indicador"
                    initial={false}
                    animate={{ rotate: isActive ? 45 : 0 }}
                    transition={mola(300, 20)}
                  >
                    <motion.svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      initial={false}
                      animate={{ opacity: isActive || isHovered ? 1 : 0.45 }}
                      transition={fade(0.2)}
                    >
                      <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </motion.svg>
                  </motion.span>
                </span>

                {/* a linha de baixo: fio fino sempre, e a tinta que se estende ao abrir */}
                <span className="ia-linha" aria-hidden="true" />
                <motion.span
                  className="ia-linha-ativa"
                  aria-hidden="true"
                  initial={false}
                  animate={{ scaleX: isActive ? 1 : isHovered ? 0.3 : 0 }}
                  transition={mola(300, 30)}
                />
              </motion.button>
            </h3>

            {/* A RESPOSTA FICA SEMPRE NO DOM (ver o topo do arquivo). Fechada: altura zero, sem
                opacidade e inert. Aberta: a mesma mola e o mesmo fade do autor. */}
            <motion.div
              id={painelId}
              role="region"
              aria-labelledby={botaoId}
              className="ia-painel"
              inert={!isActive}
              initial={false}
              animate={
                isActive
                  ? {
                      height: "auto",
                      opacity: 1,
                      transition: { height: mola(300, 30), opacity: fade(0.2, 0.1) },
                    }
                  : {
                      height: 0,
                      opacity: 0,
                      transition: { height: mola(300, 30), opacity: fade(0.1) },
                    }
              }
            >
              <motion.div
                className="ia-resposta"
                initial={false}
                animate={{ y: isActive ? 0 : -10 }}
                transition={mola(300, 25)}
              >
                {item.resposta}
              </motion.div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export default InteractiveAccordion;
