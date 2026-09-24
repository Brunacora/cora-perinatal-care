import { useTranslations } from "next-intl";
import { CenaContornos, type Ponto } from "./ui/CenaContornos";

/**
 * Secao 8, "Why families choose Cora". Passe 2: os contornos (ui/CenaContornos).
 *
 * E aqui que a forma-assinatura do site aparece inteira: a linha continua que se desenha e nunca
 * fecha. Quatro cards de contorno sobre o campo papel-2, cada um desenhado pela rolagem.
 *
 * Copy verbatim do roteiro.
 */
export function Why() {
  const t = useTranslations("why");
  const pontos = t.raw("points") as Ponto[];

  return <CenaContornos tituloId="why-titulo" titulo={t("title")} pontos={pontos} />;
}
