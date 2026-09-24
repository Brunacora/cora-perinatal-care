import { useTranslations } from "next-intl";
import { destino } from "@/lib/destino";
import { Inteiras } from "./Enfase";
import { CenaMesa, type Prova, type Tempo } from "./ui/CenaMesa";

type Tier = { name: string; bullets: string[] };

/**
 * Secao 6, os cuidados complementares. Passe 2, QUARTA versao: "a mesa" (ui/CenaMesa).
 *
 * As tres primeiras foram descartadas. As duas primeiras eram lista, e lista nao e cena. A
 * terceira era cena mas com moldura fixa, e moldura fixa ESMAGA foto: os arquivos desta secao
 * tem proporcoes diferentes (o carimbo e retrato 912x1488, as outras duas sao paisagem
 * 1024x682), entao um quadro so cortava dois tercos de alguma delas.
 *
 * Aqui cada foto e uma PROVA com a proporcao do proprio arquivo, e as provas sao depositadas
 * sobre a mesa conforme a pessoa rola. Nada e cortado, a secao ocupa uma tela so, e o gesto
 * ("poe-se a lembranca sobre o papel") e o que a secao vende.
 *
 * POR QUE QUATRO TEMPOS E NAO TRES: os pacotes de placenta sao tres faixas de preco e, junto do
 * paragrafo, nao cabiam numa tela de celular. Ganharam tempo proprio, e de quebra o preco fica
 * sozinho na tela, sem concorrer com o texto.
 *
 * Copy verbatim do roteiro, inclusive a citacao da fonte cientifica.
 */
export function Additional() {
  const t = useTranslations("additional");
  const u = useTranslations("ui");
  const textoAlt = useTranslations("alt");
  const tiers = t.raw("tiers") as Tier[];
  const benefits = t.raw("placenta.benefits") as string[];

  const provas: Prova[] = [
    {
      chave: "carimbo",
      foto: {
        // o carimbo de placenta: retrato, e a imagem mais bonita e mais exclusiva do projeto
        src: "/fotos/carimbo-placenta-vermelho-a.jpg",
        alt: textoAlt("carimbo"),
        w: 1068,
        h: 1473,
      },
    },
    {
      chave: "capsulas",
      foto: {
        src: "/fotos/capsulas-placenta-01.jpg",
        alt: textoAlt("capsulas"),
        w: 1448,
        h: 1086,
      },
    },
    {
      chave: "closing",
      foto: {
        src: "/fotos/closing-of-the-bones-01.jpg",
        alt: textoAlt("closing"),
        w: 1537,
        h: 1023,
      },
    },
  ];

  const tempos: Tempo[] = [
    {
      chave: "abertura",
      prova: 0,
      rotulo: t("name"),
      titulo: t("short"),
      corpo: (
        <>
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
        </>
      ),
    },
    {
      chave: "placenta",
      prova: 1,
      rotulo: t("placenta.title"),
      titulo: t("placenta.title"),
      corpo: <p>{t("placenta.p1")}</p>,
      folha: {
        rotulo: u("more"),
        titulo: t("placenta.title"),
        conteudo: (
          <>
            <p>{t("placenta.p2")}</p>
            <p>{t("placenta.p3")}</p>
            <ul className="degrau-lista folha-lista">
              {benefits.map((b) => (
                <li key={b}>
                  <Inteiras texto={b} />
                </li>
              ))}
            </ul>
            {/* AS QUATRO NOTAS GANHARAM O MARCADOR DO RESTO DO SITE (pedido da Bruna,
                2026-09-23). Elas eram uma lista sem marcador, logo depois da lista de benefícios
                das cápsulas, e as duas se misturavam: ela leu o parágrafo do processo como se
                fosse parte dos benefícios. Com o marcador, o parágrafo acima passa a ler como a
                introdução destas quatro, que é exatamente o que ela desenhou na revisão. */}
            <p>{t("placenta.process")}</p>
            <ul className="degrau-lista folha-lista">
              <li>{t("placenta.capsules")}</li>
              <li>{t("placenta.cord")}</li>
              <li>{t("placenta.print")}</li>
              <li>{t("placenta.tincture")}</li>
            </ul>
            <p className="folha-evidencia">{t("placenta.evidence")}</p>
            <p className="texto-apoio">
              <a
                href={t("placenta.sourceUrl")}
                target="_blank"
                rel="noopener noreferrer"
                className="link-linha"
              >
                <CaudaInteira texto={t("placenta.source")} />
              </a>
            </p>
          </>
        ),
      },
    },
    {
      chave: "pacotes",
      prova: 1,
      rotulo: t("packagesTitle"),
      titulo: t("packagesTitle"),
      corpo: (
        <>
          <div className="mesa-tiers trilho">
            {tiers.map((tier) => (
              <div key={tier.name} className="tier">
                <p className="tier-nome">{tier.name}</p>
                <ul className="degrau-lista">
                  {tier.bullets.map((b) => (
                    <li key={b}>
                  <Inteiras texto={b} />
                </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="texto-apoio mesa-nota">{t("packagesNote")}</p>
        </>
      ),
    },
    {
      chave: "closing",
      prova: 2,
      rotulo: t("closing.title"),
      titulo: t("closing.title"),
      corpo: (
        <>
          <p>{t("closing.p1")}</p>
          <p className="texto-apoio mesa-nota">{t("closing.p3")}</p>
        </>
      ),
      folha: {
        rotulo: u("more"),
        titulo: t("closing.title"),
        conteudo: <p>{t("closing.p2")}</p>,
      },
    },
  ];

  return (
    <CenaMesa
      tituloId="additional-titulo"
      titulo={t("name")}
      provas={provas}
      tempos={tempos}
      cta={t("cta")}
      ctaHref={destino("additional")}
      fechar={u("less")}
      rotuloAnterior={u("previous")}
      rotuloProximo={u("next")}
    />
  );
}

/**
 * O FIM DO ENDEREÇO FICA INTEIRO na última linha. A fonte citada pela cliente termina numa URL, e
 * URL é uma palavra só: o espaço inflexível que a copy recebe no carregamento não alcança o meio
 * dela. MEDIDO a 320px: o navegador quebrava o endereço e deixava o ")" sozinho na última linha.
 * Apresentação, não copy: o texto é o mesmo, só o fim dele não se parte.
 */
function CaudaInteira({ texto, n = 15 }: { texto: string; n?: number }) {
  if (texto.length <= n * 2) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, -n)}
      <span className="sem-quebra">{texto.slice(-n)}</span>
    </>
  );
}
