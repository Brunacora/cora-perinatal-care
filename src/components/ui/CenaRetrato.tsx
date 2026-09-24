"use client";

import Image from "next/image";
import { Fragment, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { MaskedTextReveal } from "./text-reveal-mask";
import { tituloEmTrilho } from "@/lib/camera";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, SplitText);

/**
 * Seções 9 e 10, a história da Bruna e a Mission: O RETRATO (autoral, GSAP; 2026-09-11).
 *
 * PICO 2 do `movimento.md`. É a seção mais pessoal do site e a de leitura mais longa: 2.065
 * caracteres em primeira pessoa, mais a frase de fecho e os 567 da Mission.
 *
 * O RETRATO FICA, A HISTÓRIA PASSA. No desktop a foto é uma coluna FIXA: ela acompanha a leitura
 * inteira, em vez de sumir no primeiro parágrafo. Coluna fixa também não tem como abrir buraco,
 * que é a lição que a seção 6 me cobrou caro. No celular a foto abre a seção e o texto vem
 * abaixo, porque não existe segunda coluna para ela ocupar.
 *
 * A FOTO É COLORIDA, e isto MUDA o que o `movimento.md` tinha escrito no Passe 0 ("foto em preto
 * e branco dentro do arco-linha"). Naquele momento a foto não existia. A que o Gabriel trouxe tem
 * a Bruna de TERRACOTA, a cor exata da tinta da marca, sobre verde de folhagem. Passar isso para
 * cinza jogaria fora o melhor encontro entre foto e paleta do projeto inteiro. A matéria decide,
 * e a decisão está registrada nas pendências.
 *
 * O ARCO é a forma-assinatura em volta dela, e se DESENHA com a rolagem, como na seção 8.
 *
 * "CORAÇÃO". A copy dela diz, com todas as letras, que Cora vem de coração. A palavra guarda o
 * nome da marca dentro dela, e ninguém vê isso lendo corrido. Aqui o "Cora" de "coração" ganha a
 * tinta e o resto fica em texto normal, então o leitor VÊ o nome aparecer dentro da palavra. É
 * apresentação, não copy: o arquivo de mensagens continua limpo.
 *
 * A FRASE DE FECHO usa o Text Reveal (Mask) do 21st.dev (19257, soralabs), com a animação dele.
 * Ver `text-reveal-mask.tsx` e a nota no acervo. É do Motion; o GSAP não toca nela.
 *
 * Reduced-motion: arco inteiro, texto no estado final, e o próprio componente do fecho já trata.
 */
export function CenaRetrato({
  tituloId,
  titulo,
  paragrafos,
  maisRotulo,
  menosRotulo,
  fecho,
  fechoEnfase,
  cta,
  ctaHref,
  missaoTitulo,
  missao,
  foto,
}: {
  tituloId: string;
  titulo: React.ReactNode;
  paragrafos: string[];
  /** rotulo do "Read more" que guarda a segunda metade da historia */
  maisRotulo: string;
  /** o mesmo botao quando ja esta aberto ("Close"). Ver a nota no botao. */
  menosRotulo: string;
  fecho: string;
  fechoEnfase: string;
  cta: string;
  ctaHref: string;
  missaoTitulo: string;
  missao: string;
  foto: { src: string; alt: string };
}) {
  const secao = useRef<HTMLElement | null>(null);
  const partes = repartir(fecho, fechoEnfase);
  const aVista = paragrafos.slice(0, 2);
  const resto = paragrafos.slice(2);
  const [aberto, setAberto] = useState(false);

  useGSAP(
    () => {
      const raiz = secao.current;
      if (!raiz) return;

      const quadro = raiz.querySelector<HTMLElement>(".retrato-quadro");
      const traco = raiz.querySelector<SVGPathElement>(".retrato-arco-traco");
      const svg = raiz.querySelector<SVGSVGElement>(".retrato-arco");
      const img = raiz.querySelector<HTMLElement>(".retrato-foto img");
      const tituloEl = raiz.querySelector<HTMLElement>(".retrato-titulo");
      /* so os paragrafos que estao SEMPRE a vista: os de dentro do "Read more" aparecem com a
         abertura, e animar os dois ao mesmo tempo deixaria o texto entrando duas vezes */
      const paras = gsap.utils.toArray<HTMLElement>(".retrato-texto > p", raiz);
      const missaoEl = raiz.querySelector<HTMLElement>(".missao-bloco");

      /* o arco desenhado nas medidas REAIS do quadro: meia-volta em cima, cantos suaves embaixo */
      const desenhar = () => {
        if (!quadro || !traco || !svg) return;
        const w = quadro.offsetWidth;
        const h = quadro.offsetHeight;
        if (!w || !h) return;
        const o = 0.75;
        const rTopo = w / 2 - o;
        const rBase = 16;
        const d = [
          `M ${o} ${h - rBase - o}`,
          `V ${rTopo + o}`,
          `A ${rTopo} ${rTopo} 0 0 1 ${w - o} ${rTopo + o}`,
          `V ${h - rBase - o}`,
          `A ${rBase} ${rBase} 0 0 1 ${w - rBase - o} ${h - o}`,
          `H ${rBase + o}`,
          `A ${rBase} ${rBase} 0 0 1 ${o} ${h - rBase - o}`,
        ].join(" ");
        traco.setAttribute("d", d);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      };
      desenhar();

      const corte = tituloEl
        ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras */
          new SplitText(tituloEl, { type: "lines", linesClass: "retrato-linha", mask: "lines", reduceWhiteSpace: false })
        : null;

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { anima } = ctx.conditions as { anima: boolean };
          desenhar();

          if (!anima) {
            if (corte) gsap.set(corte.lines, { yPercent: 0, opacity: 1 });
            if (traco) gsap.set(traco, { drawSVG: "0% 100%" });
            gsap.set(paras, { opacity: 1, y: 0 });
            if (missaoEl) gsap.set(missaoEl, { opacity: 1, y: 0 });
            return;
          }

          /* o título em trilho curto, a caligrafia do site inteiro (Passe 3) */
          if (corte && tituloEl) tituloEmTrilho(corte.lines, tituloEl);

          /* O ARCO SE DESENHA NA MÃO DE QUEM ROLA, como os contornos da seção 8: é a mesma
             caligrafia, e é o que faz o site parecer uma câmera só e não dez truques. */
          if (traco && quadro) {
            gsap.fromTo(
              traco,
              { drawSVG: "0% 0%" },
              {
                drawSVG: "0% 100%",
                ease: "none",
                scrollTrigger: {
                  trigger: quadro,
                  start: "top 86%",
                  end: "top 40%",
                  scrub: 0.5,
                  invalidateOnRefresh: true,
                  onRefresh: desenhar,
                },
              },
            );
          }

          /* a foto se revela por cortina e se acomoda: mesmo gesto dos capítulos da seção 4 */
          const fotoEl = raiz.querySelector<HTMLElement>(".retrato-foto");
          if (fotoEl) {
            gsap.fromTo(
              fotoEl,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.1,
                ease: "power2.inOut",
                scrollTrigger: { trigger: quadro ?? fotoEl, start: "top 82%", once: true },
              },
            );
          }
          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.12 },
              {
                scale: 1,
                duration: 1.6,
                ease: "power2.out",
                scrollTrigger: { trigger: quadro ?? img, start: "top 82%", once: true },
              },
            );
          }

          paras.forEach((p) => {
            gsap.fromTo(
              p,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: { trigger: p, start: "top 86%", once: true },
              },
            );
          });

          /* ---- O VOO AO LADO DO "READ MORE" (celular) ----
             Exatamente o voo da secao 4, com os mesmos numeros: a asa bate (scaleX), o corpo
             balanca devagar (rotation) e sobe e desce (y). A amplitude vertical e menor porque
             o campo tem so a altura da linha do botao. */
          gsap.utils.toArray<HTMLElement>(".borboletas-mais .borboleta", raiz).forEach((b, i) => {
            const asa = b.querySelector(".borboleta-asa");
            if (asa) {
              gsap.to(asa, {
                scaleX: 0.55,
                duration: 0.26 + i * 0.06,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: "50% 50%",
              });
              gsap.to(asa, {
                rotation: i === 0 ? 7 : -8,
                duration: 3.4 + i * 0.7,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: "50% 50%",
              });
            }
            gsap.fromTo(
              b,
              { y: i === 0 ? -6 : 5 },
              { y: i === 0 ? 7 : -6, duration: 3.8 + i * 0.9, ease: "sine.inOut", repeat: -1, yoyo: true },
            );
          });

          /* ---- AS BORBOLETAS QUE ACOMPANHAM A LEITURA (desktop) ----
             Tres camadas, e cada uma com UM dono de transform, a regra que a secao 6 cobrou:
               .pouso-trilho  -> o CSS (sticky): e ele que desce e sobe com a rolagem
               .pouso-voo     -> a deriva ligada a rolagem (GSAP, scrub): elas balancam de lado
                                 enquanto descem, para a travessia parecer voo e nao elevador
               .borboleta     -> a flutuacao continua em y (GSAP), igual a secao 4
               .borboleta-asa -> o bater de asa e o balanco, com os mesmos numeros da secao 4 */
          gsap.utils.toArray<HTMLElement>(".pouso .borboleta", raiz).forEach((b, i) => {
            const asa = b.querySelector(".borboleta-asa");
            if (asa) {
              gsap.to(asa, {
                scaleX: 0.55,
                duration: 0.26 + i * 0.06,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: "50% 50%",
              });
              gsap.to(asa, {
                rotation: i === 0 ? 7 : -8,
                duration: 3.4 + i * 0.7,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: "50% 50%",
              });
            }
            gsap.fromTo(
              b,
              { y: i === 0 ? -10 : 8 },
              { y: i === 0 ? 12 : -10, duration: 3.8 + i * 0.9, ease: "sine.inOut", repeat: -1, yoyo: true },
            );
          });

          const baixo = raiz.querySelector<HTMLElement>(".retrato-baixo");
          gsap.utils.toArray<HTMLElement>(".pouso-voo", raiz).forEach((v, i) => {
            gsap.to(v, {
              keyframes: {
                x: i === 0 ? [0, -26, 10] : [0, 22, -8],
                rotation: i === 0 ? [0, -7, 4] : [0, 6, -3],
              },
              ease: "none",
              scrollTrigger: {
                trigger: baixo ?? raiz,
                start: "top 70%",
                end: "bottom 30%",
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            });
          });

          if (missaoEl) {
            gsap.fromTo(
              missaoEl,
              { opacity: 0, y: 22 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: { trigger: missaoEl, start: "top 84%", once: true },
              },
            );
          }
        },
      );

      window.addEventListener("resize", desenhar);
      return () => {
        window.removeEventListener("resize", desenhar);
        corte?.revert();
      };
    },
    { scope: secao, dependencies: [paragrafos.length] },
  );

  return (
    <section id="about" className="secao secao-retrato" aria-labelledby={tituloId} ref={secao}>
      <div className="container retrato-grade">
        <div className="retrato-coluna" data-camada="frente">
          <figure className="retrato-quadro">
            {/* o arco é a forma-assinatura em volta dela, e se desenha com a rolagem */}
            <svg className="retrato-arco" aria-hidden="true" preserveAspectRatio="none">
              <path className="retrato-arco-traco" />
            </svg>
            <div className="retrato-foto">
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                quality={90}
                sizes="(min-width: 900px) 38vw, 86vw"
                style={{ objectPosition: "50% 28%" }}
              />
            </div>
          </figure>
        </div>

        <div className="retrato-texto" data-camada="meio">
          <h2 id={tituloId} className="retrato-titulo">
            {titulo}
          </h2>
          {/* O "READ MORE" E SO DO CELULAR, e isso e MEDIDO, nao gosto.
              No desktop a altura da secao e ditada pela coluna FIXA da foto (658px), nao pelo
              texto: esconder 1.269 caracteres la economizava 218px, quase nada, e custava uma
              interacao a mais no meio de uma leitura pessoal. No celular nao ha foto ao lado,
              entao o texto E a altura, e ali o corte vale muito.
              Por isso o resto NAO fica num `details`: ele fica sempre na marcacao, e quem decide
              se aparece e o CSS, pela largura da tela. Assim o desktop nao tem estado nenhum
              para piscar na hidratacao, e o buscador le os quatro paragrafos sempre. */}
          {aVista.map((p, i) => (
            <p key={i}>
              <Coracao texto={p} />
            </p>
          ))}
          {resto.length > 0 ? (
            <>
              <div className="retrato-resto" data-aberto={aberto ? "true" : "false"}>
                <div className="retrato-resto-corpo">
                  {resto.map((p, i) => (
                    <p key={i}>
                      <Coracao texto={p} />
                    </p>
                  ))}
                </div>
              </div>
              {/* A LINHA DO "READ MORE": o botao a esquerda e, no vao a direita dele, duas
                  borboletas pequenas voando no lugar. E o mesmo gesto da secao 3, onde a mulher
                  anda ao lado do "Read more" no celular: aquele espaco deixa de ser sobra e
                  passa a ter dono. O campo nao soma altura, porque vive dentro da linha de 44px
                  do proprio botao. Pedido do Gabriel, a partir do print do celular. */}
              <div className="retrato-mais-linha">
              <button
                type="button"
                className="retrato-mais"
                aria-expanded={aberto}
                onClick={() => {
                  setAberto((v) => !v);
                  /* a secao muda de altura, entao tudo que esta abaixo precisa se remedir */
                  window.setTimeout(() => ScrollTrigger.refresh(), 460);
                }}
              >
                {/* O ROTULO TROCA QUANDO ABRE, e isto era um defeito ate 2026-09-23. O botao
                    dizia "Read more" tambem depois de aberto, entao quem descia continuava vendo
                    um convite para abrir o que ja estava aberto (a Bruna reportou exatamente
                    isso). O `ui.less` ja existia nas mensagens e nao era usado aqui. */}
                <span>{aberto ? menosRotulo : maisRotulo}</span>
                <span className={`acordeao-indicador${aberto ? " esta-aberto" : ""}`} aria-hidden="true" />
              </button>
              <span className="borboletas-mais" aria-hidden="true">
                <span className="borboleta voo-a">
                  <span className="borboleta-asa">
                    <Image src="/fotos/borboleta-2.png" alt="" width={475} height={528} sizes="60px" />
                  </span>
                </span>
                <span className="borboleta voo-b">
                  <span className="borboleta-asa">
                    <Image src="/fotos/borboleta-3.png" alt="" width={487} height={502} sizes="48px" />
                  </span>
                </span>
              </span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* A PARTE DE BAIXO DA SECAO: a frase de fecho, a Mission e o convite na coluna da
          esquerda; na da direita, o TRILHO das borboletas, que vai da frase ate o fim da secao.
          No celular e uma coluna so e o trilho nao existe. */}
      <div className="container retrato-baixo">
        <div className="retrato-baixo-texto">
      <div className="retrato-fecho">
        {/* A FRASE MAIS FORTE DO ROTEIRO INTEIRO, e o pico emocional do site.
            Text Reveal (Mask), 21st.dev 19257. Dono do movimento: Motion, nao o GSAP. */}
        <MaskedTextReveal
          as="p"
          className="fecho-frase display"
          splitBy="lines"
          stagger={0.11}
          viewportMargin="0px 0px -18% 0px"
        >
          {/* AS PARTES ENTRAM INLINE, e isto nao e estilo: e obrigacao.
              O componente percorre a arvore de ELEMENTOS para contar palavras, e ele nao
              renderiza componentes proprios pelo caminho. Passando <Realce /> ele enxergava
              zero palavras, caia no modo texto puro e a frase mais importante do site ficava
              SEM animacao nenhuma, parecendo certa na tela. Texto e <strong> diretos aqui. */}
          {partes.antes}
          {partes.palavra ? <strong>{partes.palavra}</strong> : null}
          {partes.depois}
        </MaskedTextReveal>
      </div>

        {/* A MISSION FECHA A HISTORIA e nao abre secao nova. Ela nasceu SEM titulo de proposito:
            a historia inteira esta em primeira pessoa e a mission em terceira, e a TROCA DE VOZ
            marcava a passagem sozinha.
            EM 2026-09-23 A BRUNA PEDIU O TITULO, nas duas revisoes (celular e desktop). O
            argumento da voz e de dentro: quem le corrido pega, quem passa o olho nao. O titulo
            entra como `h3` de verdade, o que tambem acerta a hierarquia (h2 da secao, h3 aqui)
            em vez de ser so um texto grande. */}
        <aside className="missao-bloco">
          <span className="missao-fio" aria-hidden="true" />
          <h3 className="missao-titulo">{missaoTitulo}</h3>
          <p className="missao-texto">{missao}</p>
        </aside>

        <div className="retrato-acoes">
          <a href={ctaHref} className="botao retrato-cta">
            {cta}
          </a>
        </div>
        </div>

        {/* O TRILHO DAS BORBOLETAS (so no desktop). Ideia do Gabriel, e melhor que a primeira
            versao: fixas ao lado da frase, o vao voltava a ficar vazio assim que a frase saia da
            tela. Agora elas ACOMPANHAM quem le, da frase ate o fim da secao, e sobem de volta
            quando a pessoa sobe. O descer e o subir sao do CSS (sticky), que nao tem como
            desalinhar; o bater de asa e o balanco sao do GSAP, como na secao 4. */}
        <div className="pouso" aria-hidden="true" data-camada="frente">
          <div className="pouso-trilho">
            <span className="pouso-voo pouso-voo-a">
              <span className="borboleta">
                <span className="borboleta-asa">
                  <Image src="/fotos/borboleta-3.png" alt="" width={487} height={502} sizes="200px" />
                </span>
              </span>
            </span>
            <span className="pouso-voo pouso-voo-b">
              <span className="borboleta">
                <span className="borboleta-asa">
                  <Image src="/fotos/borboleta-1.png" alt="" width={483} height={501} sizes="150px" />
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * O NOME DENTRO DA PALAVRA. A copy da Bruna diz que Cora vem de "coração"; aqui o leitor VÊ isso,
 * porque o "Cora" da palavra recebe a tinta da marca. Apresentação, não copy: o texto do arquivo
 * de mensagens continua exatamente como ela escreveu.
 */
function Coracao({ texto }: { texto: string }) {
  const i = texto.indexOf("coração");
  if (i < 0) return <>{texto}</>;
  return (
    <Fragment>
      {texto.slice(0, i)}
      <span className="palavra-coracao">
        <span className="palavra-cora">Cora</span>ção
      </span>
      {texto.slice(i + "coração".length)}
    </Fragment>
  );
}

/**
 * Reparte o fecho em antes, palavra e depois. É FUNÇÃO e não componente de propósito: o Text
 * Reveal precisa receber o `<strong>` direto na árvore para contá-lo como ênfase. Ver o
 * comentário no ponto de uso.
 */
function repartir(texto: string, palavra: string) {
  const escapada = palavra.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[\\s"(])(${escapada})(?=[\\s.,;:!?")]|$)`);
  const m = texto.match(re);
  if (!m || m.index === undefined) return { antes: texto, palavra: "", depois: "" };
  const inicio = m.index + m[1].length;
  const fim = inicio + m[2].length;
  /* A PONTUACAO COLADA VAI JUNTO com a palavra em destaque.
     O Text Reveal quebra por ESPACO e trata cada pedaco como palavra, pondo 0,25em entre elas.
     Com "too" e "." separados, a tela mostrava "too ." com um vao no meio. Levando o ponto para
     dentro do <strong> os dois viram a mesma palavra, e o ponto sai em italico junto, que e
     convencao tipografica normal depois de palavra em italico. */
  const restoBruto = texto.slice(fim);
  const grudado = restoBruto.match(/^[.,;:!?)"']+/);
  return {
    antes: texto.slice(0, inicio),
    palavra: texto.slice(inicio, fim) + (grudado ? grudado[0] : ""),
    depois: grudado ? restoBruto.slice(grudado[0].length) : restoBruto,
  };
}
