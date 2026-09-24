import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IDIOMAS_PUBLICADOS } from "@/i18n/routing";
import { Inteiras } from "./Enfase";
import { Form } from "./Form";
import { Logo } from "./Logo";
import { AssinaturaTaOnline } from "./ui/AssinaturaTaOnline";
import { CenaRodape } from "./ui/CenaRodape";
import { SimboloEmVolume } from "./ui/SimboloEmVolume";

/**
 * Seção 13, o rodapé e o formulário: PICO 3 (Passe 2, 2026-09-11).
 *
 * A cena (o campo terracota que sobe, a folha que assenta, o título linha a linha, o símbolo que se
 * desenha) é da `CenaRodape`. Aqui fica a marcação, com as camadas declaradas.
 *
 * CONTRASTE, e foi o que decidiu a composição: papel sobre a terracota da logo mede 3,96:1. Passa
 * para texto grande (o título) e não passa para corpo, que exige 4,5:1. A regra desta seção é a do
 * design.md levada até o fim: SOBRE A TINTA SÓ VAI O QUE É GRANDE (o título e o símbolo). Todo
 * corpo mora no papel: o texto final abre a folha do formulário, e os contatos e o idioma viram um
 * cartão de papel.
 *
 * Copy verbatim do roteiro (seção 13).
 */
/** `caminhoIdioma`: para onde a troca de idioma leva (a home, ou o journal quando o rodapé está nele). */
export function Footer({ caminhoIdioma = "/" }: { caminhoIdioma?: string }) {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  const locale = useLocale();

  return (
    <CenaRodape tituloId="rodape-titulo">
      <div className="campo-tinta" data-camada="fundo" aria-hidden="true" />
      <div className="container rodape-inner">
        <h2 id="rodape-titulo" className="rodape-titulo" data-camada="meio">
          <Inteiras texto={t("title")} />
        </h2>

        <div className="folha-lugar">
          <div className="folha" data-camada="frente">
            <p className="folha-abertura corpo-grande">{t("text")}</p>
            <Form />
          </div>
        </div>

        {/* o símbolo, a segunda vez que ele se desenha no site, agora em volume (o SVG é o pôster
            dele); é decorativo */}
        <div className="rodape-marca" data-camada="meio" aria-hidden="true">
          <div className="rodape-simbolo">
            <Logo variante="simbolo" altura={240} className="logo-papel" />
            <SimboloEmVolume />
          </div>
        </div>

        <div className="rodape-cartao" data-camada="meio">
          <address>
            <p className="rodape-pessoa">{t("contact.person")}</p>
            <p>{t("contact.brand")}</p>
            <p>{t("contact.area")}</p>
            <p>{t("contact.modes")}</p>
            <span className="rodape-links">
              <a href={`mailto:${t("contact.emailAddress")}`} className="link-linha">
                {t("contact.email")}
              </a>
              <a href={`tel:${t("contact.phoneNumber")}`} className="link-linha">
                {t("contact.phone")}
              </a>
              <a href={t("contact.instagramUrl")} target="_blank" rel="noopener noreferrer" className="link-linha">
                {t("contact.instagram")}
              </a>
            </span>
          </address>

          {/* O SELETOR SÓ APARECE COM MAIS DE UM IDIOMA DE VERDADE (`IDIOMAS_PUBLICADOS`). Enquanto a
              copy em português não chega, "Português" levava a uma página em inglês, e quem clicava
              achava que o site estava quebrado (o Gabriel achou, em 2026-09-11). O português
              entrou na lista no mesmo dia, e o seletor voltou junto com o hreflang e o sitemap. */}
          {IDIOMAS_PUBLICADOS.length > 1 ? (
            <nav className="rodape-idioma" aria-label={n("language")}>
              <Link
                href={caminhoIdioma}
                locale="en"
                hrefLang="en"
                lang="en"
                aria-current={locale === "en" ? "true" : undefined}
                className="link-linha"
              >
                {n("english")}
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={caminhoIdioma}
                locale="pt"
                hrefLang="pt"
                lang="pt-BR"
                aria-current={locale === "pt" ? "true" : undefined}
                className="link-linha"
              >
                {n("portuguese")}
              </Link>
            </nav>
          ) : null}
        </div>

        {/* A ASSINATURA DA AGÊNCIA: a terceira folha, a mais fina, na largura toda. Mora no papel
            porque na terracota texto pequeno não passa no contraste (3,96:1). */}
        <div className="rodape-assinatura" data-camada="meio">
          <AssinaturaTaOnline idioma={locale === "pt" ? "pt" : "en"} />
        </div>
      </div>
    </CenaRodape>
  );
}
