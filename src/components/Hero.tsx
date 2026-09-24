import { getImageProps } from "next/image";
import { useTranslations } from "next-intl";
import { Enfase } from "./Enfase";
import { Logo } from "./Logo";
import { MovimentoHero } from "./ui/MovimentoHero";

/**
 * PICO 1, versão 4: "o desenho vira foto". A hero é o mundo da logo.
 * fundo:  a placa do jardim desenhado na linha da logo. Direção de arte: 9:16 no mobile e 16:9
 *         no desktop, num único <picture>, então cada aparelho baixa uma placa só (é o LCP).
 * meio:   headline, parágrafo, botões; e o SÍMBOLO da logo (mãe, bebê, hibisco, arco), em vetor,
 *         grande, à direita. Ninguém gerado: a pessoa desenhada é a própria marca.
 * frente: os hibiscos de aquarela nos dois cantos de baixo e as borboletas, em MovimentoHero.
 *         Eles são discretos de propósito: o Gabriel reprovou a versão em que a flor dominava a
 *         cena. Aqui a flor é canto, não moldura.
 * Ao rolar (Passe 3), a figura desenhada se dissolve na foto real da Bruna, que aparece na
 * seção seguinte dentro do mesmo arco.
 */
export function Hero() {
  const t = useTranslations("hero");
  const textoAlt = useTranslations("alt");

  /* A placa é o LCP. No Next 16 o `priority` foi aposentado (a placa saía sem prioridade nenhuma):
     aqui ela carrega na hora e com prioridade alta. Não baixa as duas: numa <picture> o navegador
     escolhe UMA fonte, a do aparelho. */
  const comum = { alt: "", sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;
  const {
    props: { srcSet: placaDesktop },
  } = getImageProps({ ...comum, src: "/fotos/hero-jardim-16x9.jpg", width: 1672, height: 941 });
  const {
    props: { srcSet: placaMobile, ...placaImg },
  } = getImageProps({ ...comum, src: "/fotos/hero-jardim-9x16.jpg", width: 941, height: 1672 });

  return (
    <section id="top" className="hero" aria-labelledby="hero-titulo">
      <div className="hero-plate" data-camada="fundo" aria-hidden="true">
        <picture>
          <source media="(min-width: 768px)" srcSet={placaDesktop} />
          <source srcSet={placaMobile} />
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img {...placaImg} className="hero-plate-img" />
        </picture>
        <div className="hero-veu" />
      </div>

      <div className="container hero-grid">
        <div className="hero-texto" data-camada="meio">
          <h1 id="hero-titulo">
            <Enfase texto={t("headline")} palavra={t("enfase")} />
          </h1>
          <p className="corpo-grande hero-paragrafo">{t("text")}</p>
          <div className="hero-acoes">
            <a href="#form" className="botao">
              {t("cta")}
            </a>
            <a href="#services" className="link-linha">
              {t("secondary")}
            </a>
          </div>
        </div>

        <div className="hero-figura" data-camada="meio">
          <Logo
            variante="simbolo"
            altura={560}
            className="hero-simbolo"
            rotulo={textoAlt("heroSimbolo")}
          />
        </div>
      </div>

      <MovimentoHero />
    </section>
  );
}
