import { useTranslations } from "next-intl";
import { MinimalTestimonial, type Depoimento } from "./ui/minimal-testimonial";
import { MolduraAberta } from "./ui/MolduraAberta";
import { CameraSecao } from "./ui/CameraSecao";
import { BorboletaTravessia } from "./ui/BorboletaTravessia";

/**
 * Secao 12, os depoimentos. Passe 2.
 *
 * O roteiro e categorico: a secao e "honestamente vazia", "nenhuma avaliacao fabricada, em nenhuma
 * hipotese", e a Bruna aprovou o texto de espera ("Amei, achei perfeito").
 *
 * HOJE: nao ha depoimento nenhum, entao aparece so a espera: o titulo e o texto aprovados, dentro
 * da MOLDURA ABERTA (a forma-assinatura, desenhada pela rolagem e aberta em cima, a espera das
 * historias). O Minimal Testimonial (21st.dev 9638) esta instalado e pronto, mas com zero
 * depoimentos ele nao desenha nada.
 *
 * QUANDO OS DEPOIMENTOS REAIS CHEGAREM: acrescentar `testimonials.items` nas mensagens dos dois
 * idiomas ({ citacao, nome, papel?, foto? }) e um titulo novo para a secao. So isso.
 *
 * Copy verbatim do roteiro, inclusive as aspas e os dois pontos do titulo.
 */
export function Testimonials() {
  const t = useTranslations("testimonials");
  const depoimentos = t.has("items") ? (t.raw("items") as Depoimento[]) : [];

  return (
    <section id="testimonials" className="secao secao-testimonials" aria-labelledby="testimonials-titulo">
      {/* a câmera: o título linha a linha e o texto uma vez, dentro da moldura que se desenha */}
      <CameraSecao titulo="#testimonials-titulo" corpo=".espera-texto" />
      <div className="container testimonials-inner">
        {depoimentos.length > 0 ? (
          <>
            <h2 id="testimonials-titulo" className="espera-titulo display">
              {t("title")}
            </h2>
            <MinimalTestimonial depoimentos={depoimentos} rotuloGrupo={t("label")} />
          </>
        ) : (
          <>
          {/* uma borboleta atravessa a emenda e pousa na ponta do traço, onde as histórias vão
              chegar */}
          <BorboletaTravessia
            alvo=".moldura-aberta"
            pouso="ponta-do-vao"
            imagem={{ src: "/fotos/borboleta-3.png", w: 487, h: 502 }}
          />
          <MolduraAberta className="espera">
            <h2 id="testimonials-titulo" className="espera-titulo display" data-camada="meio">
              {t("title")}
            </h2>
            <p className="espera-texto" data-camada="meio">
              {t("text")}
            </p>
          </MolduraAberta>
          </>
        )}
      </div>
    </section>
  );
}
