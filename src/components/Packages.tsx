import { useTranslations } from "next-intl";
import { CenaPacotes, type Degrau } from "./ui/CenaPacotes";

type Pacote = { name: string; price: string; text: string; bullets: string[] };

/**
 * Seção 5, os pacotes. Passe 2: "a escada" (ui/CenaPacotes).
 *
 * Nenhum componente do catálogo entrou. A busca foi refeita em 2026-09-11 e o que existe são
 * cartões de preço de SaaS, com vidro, modo escuro e alternador mensal ou anual. Nenhum deles
 * serve a uma marca de cuidado perinatal em Modo A, e o escolhido no Passe 0 (Pricing Section da
 * Launch UI, 18963) é exatamente o cartão em caixa que o Gabriel reprovou na seção 4.
 *
 * A copy entra INTEIRA, verbatim. Os quatro itens repetidos nos três pacotes ficam, porque são
 * o que a cliente escreveu e é o que uma pessoa lendo UMA coluna precisa ver.
 */
export function Packages() {
  const t = useTranslations("packages");
  const pacotes = t.raw("items") as Pacote[];

  const degraus: Degrau[] = pacotes.map((p) => ({
    nome: p.name,
    preco: p.price,
    texto: p.text,
    itens: p.bullets,
  }));

  return <CenaPacotes rotulo={t("label")} nota={t("note")} fecho={t("closing")} degraus={degraus} />;
}
