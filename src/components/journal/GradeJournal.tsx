"use client";

import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EntraNaVista } from "./EntraNaVista";

/**
 * Os filtros e a grade do journal (roteiro do blog, Parte 3; design-blog.md, 5.4).
 *
 * Os cards chegam PRONTOS do servidor (`card`): aqui só se decide quais aparecem. Mecânica dos
 * filtros vinda do "Filter Grid" do 21st.dev (ddoemonn, demo 23525): `radiogroup` com setas do
 * teclado e o anúncio da contagem para leitor de tela. A grade de altura fixa dele NÃO veio: ela
 * cortaria os cards reais. O movimento também veio dele, com a curva da marca no lugar da mola
 * dele (mais lenta e sem ricochete): a pílula ativa DESLIZA de um filtro para o outro (`layoutId`),
 * os cards que ficam escorregam para o lugar novo (`layout="position"`) e os que saem somem em
 * 140ms (`popLayout`). POSSE: o Motion é dono do `li`; a entrada dos cards na rolagem (GSAP) mexe no
 * `article` de dentro, nunca no mesmo elemento.
 *
 * "Load more articles": oito por vez, nunca rolagem infinita (o roteiro proíbe). O filtro fica no
 * endereço (`?topic=`), para quem compartilha cair no mesmo recorte.
 */

export type ItemDaGrade = {
  slug: string;
  categoria: string;
  idioma: "en" | "pt";
  card: ReactNode;
};

type Filtro = { id: string; rotulo: string; cultural?: boolean };

const POR_VEZ = 8;

const nuncaMuda = () => () => {};

/* a curva da marca (movimento.md): lenta, sem ricochete */
const CURVA = [0.16, 1, 0.3, 1] as const;
const DESLIZA = { type: "tween", duration: 0.5, ease: CURVA } as const;
const SAI = { duration: 0.14, ease: [0.4, 0, 1, 1] } as const;
const NADA = { duration: 0 } as const;

export function GradeJournal({
  itens,
  filtros,
  rotuloFiltros,
  textoVazio,
  textoMais,
  textoMostrando,
  tituloGrade,
}: {
  itens: ItemDaGrade[];
  filtros: Filtro[];
  rotuloFiltros: string;
  textoVazio: string;
  textoMais: string;
  /** "{shown} of {total} notes" */
  textoMostrando: string;
  tituloGrade: string;
}) {
  const uid = useId();
  const reduzido = useReducedMotion();
  /* o filtro que veio no endereço (`?topic=`), lido como loja externa: no servidor não existe */
  const pedido = useSyncExternalStore(
    nuncaMuda,
    () => new URLSearchParams(window.location.search).get("topic"),
    () => null,
  );
  const [escolhido, setAtivo] = useState<string | null>(null);
  const ativo = escolhido ?? (pedido && filtros.some((f) => f.id === pedido) ? pedido : "all");
  const [limite, setLimite] = useState(POR_VEZ);
  const pilulas = useRef<(HTMLButtonElement | null)[]>([]);
  const lista = useRef<HTMLUListElement>(null);

  const escolher = useCallback((id: string) => {
    setAtivo(id);
    setLimite(POR_VEZ);
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("topic");
    else url.searchParams.set("topic", id);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const combina = useCallback(
    (item: ItemDaGrade, id: string) =>
      id === "all" ? true : id === "pt" ? item.idioma === "pt" : item.categoria === id,
    [],
  );

  const filtrados = useMemo(() => itens.filter((i) => combina(i, ativo)), [itens, ativo, combina]);
  const visiveis = filtrados.slice(0, limite);

  /* ESTADO VAZIO: nunca a tela em branco. A frase do roteiro e dois artigos de outra categoria. */
  const substitutos = useMemo(
    () => (filtrados.length === 0 ? itens.filter((i) => !combina(i, ativo)).slice(0, 2) : []),
    [filtrados.length, itens, ativo, combina],
  );

  const indice = Math.max(0, filtros.findIndex((f) => f.id === ativo));
  const ir = (i: number) => {
    const n = (i + filtros.length) % filtros.length;
    pilulas.current[n]?.focus();
    escolher(filtros[n].id);
  };
  const teclas = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const destino: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: filtros.length - 1,
    };
    if (!(e.key in destino)) return;
    e.preventDefault();
    ir(destino[e.key]);
  };

  const carregarMais = () => {
    const primeiroNovo = limite;
    setLimite((l) => l + POR_VEZ);
    /* o foco vai para o primeiro card novo: quem usa teclado continua de onde parou */
    requestAnimationFrame(() => {
      lista.current?.querySelectorAll<HTMLAnchorElement>(".card-artigo-link")[primeiroNovo]?.focus();
    });
  };

  const rotuloAtivo = filtros[indice]?.rotulo ?? "";

  return (
    <div className="grade-journal">
      <h2 id={`${uid}-titulo`} className="sr-only">
        {tituloGrade}
      </h2>
      <div className="filtros-trilho">
        <div role="radiogroup" aria-label={rotuloFiltros} aria-controls={`${uid}-lista`} className="filtros">
          {filtros.map((f, i) => {
            const on = i === indice;
            return (
              <button
                key={f.id}
                ref={(n) => {
                  pilulas.current[i] = n;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => escolher(f.id)}
                onKeyDown={(e) => teclas(e, i)}
                className="filtro"
                data-cultural={f.cultural || undefined}
                lang={f.cultural ? "pt-BR" : undefined}
              >
                {on ? (
                  <motion.span
                    aria-hidden="true"
                    className="filtro-fundo"
                    layoutId={reduzido ? undefined : `${uid}-pilula`}
                    transition={reduzido ? NADA : DESLIZA}
                  />
                ) : null}
                <span className="filtro-rotulo">{f.rotulo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="grade-vazia">
          <p className="grade-vazia-texto corpo-grande">{textoVazio}</p>
          <ul className="grade-cards" aria-labelledby={`${uid}-titulo`}>
            {substitutos.map((i) => (
              <li key={i.slug}>{i.card}</li>
            ))}
          </ul>
        </div>
      ) : (
        <ul id={`${uid}-lista`} ref={lista} className="grade-cards" aria-labelledby={`${uid}-titulo`}>
          <AnimatePresence initial={false} mode="popLayout">
            {visiveis.map((i) => (
              <motion.li
                key={i.slug}
                layout={reduzido ? false : "position"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: reduzido ? NADA : SAI }}
                transition={reduzido ? NADA : DESLIZA}
              >
                <EntraNaVista>{i.card}</EntraNaVista>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {filtrados.length > limite ? (
        <div className="grade-mais">
          <button type="button" className="botao botao-contorno" onClick={carregarMais}>
            {textoMais}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {rotuloAtivo}:{" "}
        {textoMostrando
          .replace("{shown}", String(Math.min(limite, filtrados.length)))
          .replace("{total}", String(filtrados.length))}
      </p>
    </div>
  );
}
