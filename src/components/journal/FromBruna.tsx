import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Inteiras } from "../Enfase";
import { CenaFromBruna } from "./CameraJournal";
import { FitaDoCaderno } from "./FitaDoCaderno";

/**
 * "From Bruna" (roteiro do blog, Parte 5; design-blog.md, 5.8): quem escreve aqui. PICO 2 do blog.
 *
 * A foto fica dentro do ARCO de tinta: é nele que termina a linha que acompanhou a leitura
 * (Passe 3). "The Cora Journal started there." é o ponto de virada da história e ganha tratamento
 * próprio. O campo de papel-2 é declarado como camada de fundo: no Passe 3 ele sobe e entrega a
 * seção, sem linha divisória.
 *
 * A linha manuscrita opcional do roteiro ("You deserve to be cared for, too.") NÃO entra: o roteiro
 * a condiciona ao OK da cliente.
 */
export async function FromBruna() {
  const t = await getTranslations("journal.author");
  const alt = await getTranslations("alt");
  return (
    <section className="secao from-bruna" aria-labelledby="from-bruna-titulo">
      <CenaFromBruna />
      <div className="campo-leitura" data-camada="fundo" aria-hidden="true" />
      {/* a fita pende da BORDA DE CIMA da seção (que não se move), no vão entre a foto e o texto:
          marca onde a leitora parou, junto de quem escreve */}
      <FitaDoCaderno onde="autoria" />
      <div className="container from-bruna-grade">
        <figure className="from-bruna-quadro" data-camada="frente">
          {/* no celular a fita sai do alto da foto (no desktop, do alto da seção: ver abaixo) */}
          <FitaDoCaderno onde="autoria-celular" />
          {/* o arco a 14px da foto, com o mesmo centro do semicírculo dela: caixa de 428 x 514 para uma
              foto de 400 x 500 (4:5) */}
          <svg className="from-bruna-arco" viewBox="0 0 428 514" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="from-bruna-arco-traco"
              d="M 0.75 514 L 0.75 214 A 213.25 213.25 0 0 1 427.25 214 L 427.25 514"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="from-bruna-foto">
            <Image
              src="/fotos/bruna-escritorio-01.jpg"
              alt={alt("brunaEscritorio")}
              fill
              sizes="(min-width: 1024px) 400px, 80vw"
              quality={90}
              className="from-bruna-img"
            />
          </div>
        </figure>

        <div className="from-bruna-texto" data-camada="meio">
          <h2 id="from-bruna-titulo" className="from-bruna-titulo">
            <Inteiras texto={t("title")} />
          </h2>
          <p className="corpo-grande">{t("p1")}</p>
          <p className="from-bruna-acende">{t("p2")}</p>
          <p className="from-bruna-virada">{t("turn")}</p>
          <p>{t("p3")}</p>
          <p className="from-bruna-fecho">{t("p4")}</p>
          <a href="#form" className="botao from-bruna-botao">
            {t("button")}
          </a>
        </div>
      </div>
    </section>
  );
}
