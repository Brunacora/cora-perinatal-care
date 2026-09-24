import { ViewTransition, type ReactNode } from "react";
import Image from "next/image";
import type { Artigo, Categoria } from "@/lib/journal";

/**
 * A CAPA TIPOGRÁFICA (design-blog.md, 5.1): a peça que dá identidade à grade do journal.
 *
 * Uma placa 3:2 na cor da categoria, a FRASE da capa em Gambetta e um fragmento da linha contínua
 * da marca atravessando a placa. É desenhada pelo código a partir do título, então a Bruna nunca
 * precisa desenhar capa. Com foto no painel, a foto entra no lugar da placa.
 *
 * A capa é DECORATIVA (`aria-hidden`) quando é tipográfica: o título já está escrito ao lado. Com
 * foto, a foto tem descrição.
 *
 * A PASSAGEM DA LISTAGEM PARA O ARTIGO (movimento-blog.md, seção 5): a mesma capa, com o mesmo
 * nome de transição no card e no topo do artigo, CRESCE do card até o lugar dela no artigo (a
 * `<ViewTransition>` do React, que o Next 16 liga sem configuração). Sem suporte no navegador, a
 * página só troca. `default="none"` impede cada capa de piscar em toda navegação alheia.
 */

/* Um gesto da linha por categoria. Todos nascem do mesmo traço do símbolo: o arco que segura, a
   laçada, a porta, a pétala e o ponto de partida. A informação nunca é só a forma: o nome da
   categoria está escrito no card. viewBox 300 x 200. */
const GESTOS: Record<Categoria, string> = {
  "you-are-seen": "M 222 214 L 222 96 A 38 38 0 0 1 298 96 L 298 214",
  "what-no-one-told-you":
    "M -4 44 C 70 44 150 30 204 40 C 252 50 264 92 238 102 C 212 112 196 84 220 68 C 250 48 276 40 304 38",
  "behind-cora": "M 206 214 L 206 104 A 43 43 0 0 1 292 104 L 292 214 M 249 214 L 249 156",
  "brazilian-roots":
    "M 304 132 C 270 134 246 118 246 94 C 246 70 274 64 282 84 C 290 104 262 116 244 102 C 224 86 232 50 262 34",
  "where-to-start": "M 226 150 C 246 128 270 118 304 118 M 222 150 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0",
};

export function CapaTipografica({
  artigo,
  tamanho = "card",
  prioridade = false,
}: {
  artigo: Artigo;
  tamanho?: "card" | "destaque" | "artigo";
  prioridade?: boolean;
}) {
  const frase = artigo.tela.frase;
  const larguras =
    tamanho === "artigo"
      ? "(min-width: 1024px) 900px, 100vw"
      : tamanho === "destaque"
        ? "(min-width: 1024px) 55vw, 100vw"
        : "(min-width: 768px) 45vw, 100vw";

  const passagem = (filho: ReactNode) => (
    <ViewTransition name={`capa-${artigo.slug}`} share="capa-cresce" default="none">
      {filho}
    </ViewTransition>
  );

  if (artigo.fotoDaCapa) {
    return passagem(
      <div className="capa capa-foto" data-tamanho={tamanho} data-categoria={artigo.categoria}>
        <Image
          src={artigo.fotoDaCapa}
          alt={artigo.descricaoDaFoto}
          fill
          sizes={larguras}
          quality={90}
          priority={prioridade}
          className="capa-img"
        />
      </div>,
    );
  }

  return passagem(
    <div className="capa" data-tamanho={tamanho} data-categoria={artigo.categoria} aria-hidden="true">
      <svg className="capa-linha" viewBox="0 0 300 200" preserveAspectRatio="xMaxYMid slice">
        {/* `pathLength` 1: o traço se DESENHA pela variável `--capa-traco` (0 a 1), que a rolagem
            escreve (a capa viva dos cards e a máscara em arco do destaque e do artigo) */}
        <path d={GESTOS[artigo.categoria]} pathLength={1} />
      </svg>
      <span className="capa-frase">{frase}</span>
    </div>,
  );
}
