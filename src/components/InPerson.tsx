import { useTranslations } from "next-intl";
import { destino } from "@/lib/destino";
import { CenaPresencial } from "./ui/CenaPresencial";

/**
 * Bloco 1, a oferta principal, sobre o campo pêssego. Passe 2 (terceira versão, 2026-09-10):
 * a cena "a linha que segura", dirigida pela rolagem em GSAP. A copy fica intacta: título e
 * apresentação à vista, os dois parágrafos atrás do rótulo de interface "Read more" (pedido do
 * Gabriel: menos massa de texto), a lista e o botão acendendo com a linha.
 */
export function InPerson() {
  const t = useTranslations("inperson");
  const u = useTranslations("ui");
  const textoAlt = useTranslations("alt");

  return (
    <CenaPresencial
      tituloId="inperson-titulo"
      titulo={t("name")}
      short={t("short")}
      p1={t("p1")}
      p2={t("p2")}
      more={u("more")}
      bullets={t.raw("bullets") as string[]}
      price={t("price")}
      cta={t("cta")}
      ctaHref={destino("inperson")}
      fotos={[
        { src: "/fotos/cuidado-presencial-01.jpg", alt: textoAlt("presencial01") },
        { src: "/fotos/cuidado-presencial-02.jpg", alt: textoAlt("presencial02") },
        { src: "/fotos/cuidado-presencial-07.jpg", alt: textoAlt("presencial07") },
      ]}
    />
  );
}
