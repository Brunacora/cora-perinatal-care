import { useTranslations } from "next-intl";
import { Inteiras } from "./Enfase";
import { InteractiveAccordion } from "./ui/interactive-accordion";
import { CameraSecao } from "./ui/CameraSecao";

type Pergunta = { q: string; a: string };

/**
 * Secao 11, "Questions you may have". Passe 2: Interactive Accordion (21st.dev 9602), com a
 * animacao dele. E um VALE: nada preso, nada disputando atencao, sete perguntas numeradas numa
 * coluna so, sobre o campo papel-2.
 *
 * As sete respostas ficam SEMPRE no HTML, abertas ou fechadas (ver o componente): e a secao que
 * mais responde as buscas de quem procura doula, e resposta que o buscador nao ve nao existe.
 *
 * Copy verbatim do roteiro.
 */
export function Faq() {
  const t = useTranslations("faq");
  const perguntas = t.raw("items") as Pergunta[];

  return (
    <section id="faq" className="secao secao-faq" aria-labelledby="faq-titulo">
      <div className="campo-papel2" data-camada="fundo" aria-hidden="true" />
      {/* a câmera entra só no título: o acordeão é do catálogo e dono do próprio movimento */}
      <CameraSecao titulo="#faq-titulo" />
      <div className="container faq-inner">
        <h2 id="faq-titulo" data-camada="meio">
          <Inteiras texto={t("title")} />
        </h2>
        <div data-camada="meio">
          <InteractiveAccordion
            itens={perguntas.map((p, i) => ({
              id: `faq-${i + 1}`,
              numero: String(i + 1).padStart(2, "0"),
              pergunta: <Inteiras texto={p.q} />,
              resposta: <p>{p.a}</p>,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
