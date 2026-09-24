import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SimboloDesenhado } from "@/components/ui/SimboloDesenhado";

/**
 * A página 404, na voz da marca (Passe 2, 2026-09-11).
 *
 * O porão também é o site: sem esta página, quem erra um endereço cai na tela padrão do Next,
 * e aquela seria a única quebra de sistema do site inteiro. Aqui a linha da logo se desenha,
 * a frase fala do jeito que a Bruna fala (nem todo dia sai como o planejado, e está tudo bem), e
 * há duas saídas: o formulário, que é a ação do site, e o começo.
 *
 * Roda dentro do layout do idioma (fontes, papel, Lenis). Quem manda para cá é
 * `[locale]/[...rest]/page.tsx`, que chama `notFound()` para qualquer endereço sem página.
 *
 * Copy PROPOSTA (o porão ainda não tem copy da cliente): pendente da aprovação da Bruna.
 */
export default function NaoEncontrada() {
  const t = useTranslations("notFound");
  const h = useTranslations("hero");

  return (
    <main className="pagina-404">
      <div className="container pagina-404-inner">
        <SimboloDesenhado className="pagina-404-simbolo" />
        <div className="pagina-404-texto">
          <h1>{t("title")}</h1>
          <p className="corpo-grande">{t("text")}</p>
          <div className="pagina-404-acoes">
            <Link href="/#form" className="botao">
              {h("cta")}
            </Link>
            <Link href="/" className="link-linha">
              {t("home")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
