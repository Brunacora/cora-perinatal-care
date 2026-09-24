"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { rolarPara } from "@/components/MovimentoProvider";
import type { Subtitulo } from "@/lib/journal";

/**
 * O índice do artigo ("In this note"), só com três subtítulos ou mais (componentes-blog.md).
 *
 * Origem: 21st.dev, "Table of Contents" de inference-sh (demo 18123). Veio dele o destaque da seção
 * ativa por IntersectionObserver (a faixa de observação no topo da tela). Mudou: os itens continuam
 * LINKS de verdade (funcionam sem JavaScript e no leitor de tela), o clique rola pela Lenis
 * (`rolarPara`, porque `scrollIntoView` com a Lenis ligada é puxado de volta), e o ícone de lucide
 * e as cores do autor saíram para os tokens da marca.
 *
 * Dois desenhos do mesmo índice: recolhido no celular (um `<details>`, ao alcance do polegar) e
 * aberto na margem do desktop. Um `<details>` fechado esconde o conteúdo e CSS nenhum o abre.
 *
 * Página original: https://21st.dev/@inference-sh/components/table-of-contents
 */
function useSecaoAtiva(ids: string[]) {
  const [ativo, setAtivo] = useState("");
  useEffect(() => {
    if (!ids.length) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids]);
  return ativo;
}

export function Indice({ titulo, subtitulos }: { titulo: string; subtitulos: Subtitulo[] }) {
  const [ids] = useState(() => subtitulos.map((s) => s.id));
  const ativo = useSecaoAtiva(ids);
  if (subtitulos.length < 3) return null;

  const ir = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    e.preventDefault();
    const folga = parseFloat(getComputedStyle(alvo).scrollMarginTop) || 96;
    rolarPara(alvo.getBoundingClientRect().top + window.scrollY - folga);
    history.replaceState(history.state, "", `#${id}`);
    e.currentTarget.closest("details")?.removeAttribute("open");
  };

  const lista = (
    <ol className="indice-lista">
      {subtitulos.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="indice-link"
            aria-current={ativo === s.id ? "location" : undefined}
            onClick={(e) => ir(e, s.id)}
          >
            {s.texto}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="indice indice-celular" aria-label={titulo}>
        <details className="indice-caixa">
          <summary className="indice-titulo">{titulo}</summary>
          {lista}
        </details>
      </nav>
      <nav className="indice indice-margem" aria-label={titulo}>
        <div className="indice-caixa">
          <p className="indice-titulo">{titulo}</p>
          {lista}
        </div>
      </nav>
    </>
  );
}
