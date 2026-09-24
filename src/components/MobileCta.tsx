"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * O botão fixo do mobile (design.md, seção 6): aparece depois que a hero sai
 * da tela e some quando o formulário está na tela, para não tapar o destino.
 */
/** `suave`: durante a leitura de um artigo o botão fica um pouco mais baixo, para não competir com o
    texto (roteiro do blog, "Versão mobile"). */
export function MobileCta({ suave = false }: { suave?: boolean }) {
  const t = useTranslations("hero");
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const form = document.getElementById("form");
    if (!hero || !form) return;
    let heroNaTela = true;
    let formNaTela = false;
    const atualizar = () => setVisivel(!heroNaTela && !formNaTela);
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.target === hero) heroNaTela = e.isIntersecting;
          if (e.target === form) formNaTela = e.isIntersecting;
        }
        atualizar();
      },
      { threshold: 0.1 },
    );
    obs.observe(hero);
    obs.observe(form);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="cta-fixo md:hidden"
      data-visivel={visivel}
      data-suave={suave || undefined}
      aria-hidden={!visivel}
    >
      <a href="#form" className="botao" tabIndex={visivel ? 0 : -1}>
        {t("cta")}
      </a>
    </div>
  );
}
