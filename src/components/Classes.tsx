import { useTranslations } from "next-intl";
import { destino } from "@/lib/destino";
import { Inteiras } from "./Enfase";
import { CenaAulas, type ItemAula } from "./ui/CenaAulas";

type Aula = { title: string; intro: string; bullets: string[]; partners: string };

/* A POSIÇÃO DO RECORTE, foto a foto. Estas fotos são CENAS LARGAS: a Bruna de um lado e a
   família do outro. Com o recorte no centro, como era, o card cortava gente fora. Cada uma
   ganhou aqui o ponto que mantém os rostos dentro do quadro. O texto alternativo mora nas
   mensagens (namespace `alt`), no idioma da página: aqui fica só a chave dele. */
const FOTOS = [
  { src: "/fotos/aula-preparacao-parto-01.jpg", alt: "aulaParto", posicao: "42% 40%" },
  { src: "/fotos/cuidado-presencial-05.jpg", alt: "aulaBebe", posicao: "58% 40%" },
  { src: "/fotos/aula-lactacao-01.jpg", alt: "aulaAmamentacao", posicao: "42% 46%" },
  { src: "/fotos/cuidado-presencial-03.jpg", alt: "aulaPosParto", posicao: "50% 44%" },
  { src: "/fotos/bruna-escritorio-telefone-01.jpg", alt: "aulaOnline", posicao: "50% 32%" },
] as const;

/** "Birth preparation class - $250" vira nome e preço, sem tocar na copy. */
function partir(titulo: string) {
  const i = titulo.lastIndexOf(" - ");
  if (i < 0) return { nome: titulo, preco: "" };
  return { nome: titulo.slice(0, i), preco: titulo.slice(i + 3) };
}

/**
 * Bloco 2, as aulas. Passe 2, versão 8: o palco preso (CenaAulas). Seis capítulos, um por tela:
 * a apresentação da seção e as cinco aulas. A copy do roteiro entra INTEIRA, sem botão de "mais"
 * e sem corte, porque a página não cresce: quem avança é a rolagem dentro do palco.
 */
export function Classes() {
  const t = useTranslations("classes");
  const u = useTranslations("ui");
  const textoAlt = useTranslations("alt");
  const aulas = t.raw("items") as Aula[];
  const fotoDa = (i: number) => ({ ...FOTOS[i], alt: textoAlt(FOTOS[i].alt) });

  const itens: ItemAula[] = aulas.map((a, i) => {
    const { nome, preco } = partir(a.title);
    return {
      chave: a.title,
      numero: String(i + 2).padStart(2, "0"),
      numeroCelular: String(i + 1).padStart(2, "0"),
      nome,
      preco,
      intro: a.intro,
      foto: fotoDa(i),
      detalhe: (
        <>
          <p className="cap-rotulo">{t("explore")}</p>
          <ul className="lista">
            {a.bullets.map((b) => (
              <li key={b}>
                <Inteiras texto={b} />
              </li>
            ))}
          </ul>
          <p className="cap-parceiros">{a.partners}</p>
        </>
      ),
    };
  });

  itens.push({
    chave: "virtual",
    numero: String(aulas.length + 2).padStart(2, "0"),
    numeroCelular: String(aulas.length + 1).padStart(2, "0"),
    nome: t("virtual.title"),
    preco: "",
    intro: t("virtual.p1"),
    foto: fotoDa(4),
    detalhe: (
      <>
        <p>{t("virtual.p2")}</p>
        <p className="cap-parceiros">{t("virtual.p3")}</p>
      </>
    ),
  });

  const capitulo0 = (
    <div className="cap-corpo cap-corpo-intro">
      {/* A ABERTURA NÃO TEM NÚMERO NO CELULAR: lá a contagem começa na primeira aula (pedido da
          Bruna), e um "01" aqui brigaria com o "01" da primeira aula. */}
      <span className="cap-numero display so-largo" aria-hidden="true">
        01 <span className="cap-total">/ 0{itens.length + 1}</span>
      </span>
      <p className="corpo-grande cap-abertura">{t("short")}</p>
      <div className="cap-detalhe">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
      </div>
      <a href={destino("classes")} className="botao cap-botao">
        {t("cta")}
      </a>
    </div>
  );

  return (
    <CenaAulas
      /* O TITULO DA SECAO E "Classes", e nao mais o nome longo das quatro aulas (pedido da Bruna,
         2026-09-23). Ela queria o mesmo destaque que "In Person Postpartum Support" tem, com o
         texto curto logo abaixo, que e o que o `capitulo0` ja faz. O nome longo descrevia bem,
         mas competia com o proprio texto de apresentacao que vem embaixo dele. Sem italico: ela
         escreveu "nao precisa ser em italico". */
      titulo={t("marcas")}
      capitulo0={capitulo0}
      itens={itens}
      rotuloMarcas={t("marcas")}
      rotuloAbertura={t("overview")}
      rotuloAnterior={u("previous")}
      rotuloProximo={u("next")}
      cta={t("cta")}
      ctaHref={destino("classes")}
    />
  );
}
