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
        <div className="card-lido">
          <CapaTipografica artigo={artigo} />
          <span className="card-lido-fio" aria-hidden="true" />
        </div>
        <div className="card-artigo-texto">
          <p className="etiqueta">
            <span>{t(`categories.${artigo.categoria}`)}</span>
            {artigo.idioma === "pt" ? <span className="etiqueta-pt">{t("portuguese")}</span> : null}
          </p>
          <Titulo className="card-artigo-titulo">
            <span className="card-artigo-titulo-texto">{artigo.tela.titulo}</span>
          </Titulo>
          <p className="card-artigo-resumo">{artigo.tela.resumo}</p>
          {/* o CADERNO QUE LEMBRA: a linha do tempo troca pelo estado da leitura neste aparelho
              (`data-lido` no card vivo). Só uma das três aparece; as outras saem com display:none,
              então o leitor de tela também lê uma só. */}
          <p className="card-artigo-tempo">
            <span className="tempo-novo">{t("readTime", { minutes: artigo.minutos })}</span>
            <span className="tempo-meio">{t("memory.resume")}</span>
            <span className="tempo-fim">
              <svg className="lido-arco" viewBox="0 0 22 28" aria-hidden="true">
                <path d="M1.5 27.5 V11 A9.5 9.5 0 0 1 20.5 11 V27.5" pathLength={1} />
              </svg>
              {t("memory.read")}
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
