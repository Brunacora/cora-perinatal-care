import { useTranslations } from "next-intl";
import { Enfase } from "./Enfase";
import { CenaRetrato } from "./ui/CenaRetrato";

/**
 * Secoes 9 e 10, a historia da Bruna e a Mission. Passe 2: o retrato (ui/CenaRetrato).
 *
 * PICO 2 do movimento.md, e a leitura mais longa do site: 2.065 caracteres em primeira pessoa.
 * O retrato dela fica fixo no desktop enquanto a historia passa, o arco da marca se desenha em
 * volta, e a frase de fecho usa o Text Reveal (Mask) do 21st.dev, com a animacao dele.
 *
 * A Mission fecha a secao sem titulo proprio, como o roteiro determina: a troca de voz da
 * primeira para a terceira pessoa e que marca a passagem.
 *
 * Copy verbatim do roteiro.
 */
export function Story() {
  const t = useTranslations("story");
  const m = useTranslations("mission");
  const u = useTranslations("ui");
  const textoAlt = useTranslations("alt");

  return (
    <CenaRetrato
      tituloId="story-titulo"
      titulo={<Enfase texto={t("title")} palavra={t("enfase")} />}
      paragrafos={[t("p1"), t("p2"), t("p3"), t("p4")]}
      maisRotulo={u("more")}
      menosRotulo={u("less")}
      fecho={t("closing")}
      fechoEnfase={t("fechoEnfase")}
      cta={t("cta")}
      ctaHref="#form"
      missaoTitulo={m("title")}
      missao={m("text")}
      foto={{
        src: "/fotos/bruna-retrato-externo-02.jpg",
        alt: textoAlt("retrato"),
      }}
    />
  );
}
