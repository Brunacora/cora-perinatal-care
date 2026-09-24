import Image from "next/image";
import { useTranslations } from "next-intl";
import { Enfase } from "./Enfase";
import { RevealImageMask } from "./ui/RevealImageMask";
import { CameraSecao } from "./ui/CameraSecao";
import { BorboletaTravessia } from "./ui/BorboletaTravessia";

/**
 * Seção 2. Aqui o desenho da hero vira foto: a Bruna real, com o filho no colo, dentro do
 * mesmo arco-linha. A foto floresce dentro do arco ao rolar (Reveal Image Mask, 10905, Passe 2);
 * o texto vira Reading Text Reveal (9386) quando a seção fechar; no Passe 3 a figura da logo
 * se dissolve nesta foto.
 */
export function Season() {
  const t = useTranslations("season");
  const textoAlt = useTranslations("alt");
  return (
    <section id="services" className="secao secao-season" aria-labelledby="season-titulo">
      {/* A câmera (Passe 3): o título entra linha a linha, o parágrafo uma vez, e a foto (frente)
          sobe mais depressa que o texto (meio). A máscara da foto continua do Motion, por dentro. */}
      <CameraSecao
        titulo="#season-titulo"
        corpo=".season-inner > p"
        camadas={[
          { seletor: ".season-foto", vh: 8 },
          { seletor: ".season-inner", vh: 3 },
        ]}
      />
      <div className="container season-grid">
        <div className="season-foto" data-camada="frente">
          {/* a borboleta do mundo desenhado da hero atravessa a emenda e pousa no arco dela */}
          <BorboletaTravessia
            alvo=".season-foto .arco"
            pouso="ombro-do-arco"
            imagem={{ src: "/fotos/borboleta-2.png", w: 475, h: 528 }}
          />
          <div className="arco">
            <RevealImageMask>
              <Image
                src="/fotos/amamentacao-externa-01.jpg"
                alt={textoAlt("amamentacao")}
                width={1066}
                height={1600}
                quality={90}
                sizes="(max-width: 767px) 78vw, 460px"
                className="season-foto-img"
              />
            </RevealImageMask>
          </div>
        </div>
        <div className="season-inner">
          <h2 id="season-titulo" data-camada="meio">
            <Enfase texto={t("title")} palavra={t("enfase")} />
          </h2>
          <p className="corpo-grande" data-camada="meio">
            {t("text")}
          </p>
        </div>
      </div>
    </section>
  );
}
