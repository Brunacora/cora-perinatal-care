import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Artigo } from "@/lib/journal";
import { enderecoDoArtigo } from "@/lib/journal-endereco";
import { CapaTipografica } from "./CapaTipografica";

/**
 * O card de artigo (design-blog.md, 5.2): capa, etiqueta, título, uma linha de resumo e o tempo de
 * leitura. Sem data (o roteiro tira a data da grade), sem sombra, sem borda de caixa. O card
 * inteiro é UM link, com um só alvo de foco.
 *
 * O `h3` é o nível certo na listagem (h1 da página, h2 da seção). Em "Keep reading" também.
 */
export async function CardArtigo({ artigo, nivel = 3 }: { artigo: Artigo; nivel?: 2 | 3 }) {
  const t = await getTranslations("journal");
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article className="card-artigo" lang={artigo.idioma === "pt" ? "pt-BR" : "en"}>
      <Link href={enderecoDoArtigo(artigo)} className="card-artigo-link">
        <CapaTipografica artigo={artigo} />
        <div className="card-artigo-texto">
          <p className="etiqueta">
            <span>{t(`categories.${artigo.categoria}`)}</span>
            {artigo.idioma === "pt" ? <span className="etiqueta-pt">{t("portuguese")}</span> : null}
          </p>
          <Titulo className="card-artigo-titulo">
            <span className="card-artigo-titulo-texto">{artigo.tela.titulo}</span>
          </Titulo>
          <p className="card-artigo-resumo">{artigo.tela.resumo}</p>
          <p className="card-artigo-tempo">{t("readTime", { minutes: artigo.minutos })}</p>
        </div>
      </Link>
    </article>
  );
}
