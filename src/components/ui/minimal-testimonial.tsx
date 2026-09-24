"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Minimal Testimonial, do 21st.dev (id 9638, autor jatin-yadav05).
 * https://21st.dev/@jatin-yadav05/components/minimal-testimonial
 * No original a exportação chamava `TestimonialsMinimal`.
 *
 * ENTROU COM A ANIMAÇÃO DELE: a citação que troca com fade, subida de 16px e desfoque, os rostos
 * em cinza que ganham cor, o nome que desliza. É transição de CSS, sem biblioteca.
 *
 * REGRA DE PRINCÍPIO, acima de qualquer estética: este componente só mostra depoimento REAL. Com
 * zero depoimentos ele não desenha NADA. O roteiro da Cora é categórico ("nenhuma avaliação
 * fabricada, em nenhuma hipótese"), e um quadro de citação com rosto, nome e cargo em volta de um
 * texto que não é de ninguém seria exatamente isso.
 *
 * PASSADA DE TOKENS (nível 1): cores do shadcn viraram tokens da Cora e as utilitárias do Tailwind
 * viraram classes `mt-*` no `globals.css`.
 *
 * TRÊS DEFEITOS DO ORIGINAL, corrigidos sem mudar o gesto:
 *   1. Dados e fotos da demo (cdn.21st.dev, nomes e cargos fictícios) saíram: tudo vem por prop.
 *   2. As citações eram empilhadas com posição absoluta numa caixa de 80px fixos. Citação maior que
 *      isso invadia a linha do autor. Aqui elas dividem a MESMA célula de grade, então a caixa
 *      assume a altura da citação mais longa. Mesma técnica dos tempos da seção 6.
 *   3. Leitor de tela lia as citações escondidas (só estavam transparentes). Agora a inativa leva
 *      `aria-hidden`, e cada rosto é um botão com nome e `aria-pressed`.
 * Com UM depoimento só, a fileira de rostos não aparece: não há o que escolher.
 * Sem foto, o rosto vira a inicial do nome num disco da marca, em vez de uma imagem falsa.
 */

export type Depoimento = {
  citacao: string;
  nome: string;
  papel?: string;
  foto?: string;
};

export function MinimalTestimonial({
  depoimentos,
  rotuloGrupo = "Testimonials",
}: {
  depoimentos: Depoimento[];
  /** nome acessível da fileira de rostos, no idioma da página */
  rotuloGrupo?: string;
}) {
  const [active, setActive] = useState(0);

  if (depoimentos.length === 0) return null;

  const varios = depoimentos.length > 1;

  return (
    <div className="mt">
      <div className="mt-citacoes">
        {depoimentos.map((d, i) => (
          <p
            key={i}
            className={`mt-citacao${active === i ? " esta-ativa" : ""}`}
            aria-hidden={active !== i}
          >
            {`“${d.citacao}”`}
          </p>
        ))}
      </div>

      <div className="mt-autoria">
        {varios ? (
          <>
            <div className="mt-rostos" role="group" aria-label={rotuloGrupo}>
              {depoimentos.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={`mt-rosto${active === i ? " esta-ativo" : ""}`}
                  aria-pressed={active === i}
                  aria-label={d.nome}
                  onClick={() => setActive(i)}
                >
                  {d.foto ? (
                    <Image src={d.foto} alt="" fill sizes="44px" />
                  ) : (
                    <span className="mt-inicial" aria-hidden="true">
                      {d.nome.slice(0, 1)}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <span className="mt-divisor" aria-hidden="true" />
          </>
        ) : null}

        <div className="mt-autores">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className={`mt-autor${active === i ? " esta-ativo" : ""}`}
              aria-hidden={active !== i}
            >
              <span className="mt-nome">{d.nome}</span>
              {d.papel ? <span className="mt-papel">{d.papel}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MinimalTestimonial;
