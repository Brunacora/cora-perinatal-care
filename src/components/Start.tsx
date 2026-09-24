import { useTranslations } from "next-intl";
import { CenaCaminho, type Passo } from "./ui/CenaCaminho";

/**
 * Secao 7, "Starting is simple". Passe 2: o caminho (ui/CenaCaminho).
 *
 * A decisao de forma vem da propria copy: comecar e simples, entao a secao e simples. Fluxo
 * normal, tres passos legiveis de uma vez, ar. O que a torna viva e exclusiva e o caminho: a
 * linha e o chao, e a mulher da secao 3 anda por ele do passo 01 ao 03 conforme a rolagem.
 *
 * Copy verbatim do roteiro.
 */
export function Start() {
  const t = useTranslations("start");
  const passos = t.raw("steps") as Passo[];

  return (
    <CenaCaminho
      tituloId="start-titulo"
      titulo={t("title")}
      passos={passos}
      cta={t("cta")}
      ctaHref="#form"
    />
  );
}
