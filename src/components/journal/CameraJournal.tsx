"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { camada, corpoUmaVez, tituloEmTrilho } from "@/lib/camera";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin);

/**
 * A CÂMERA DO JOURNAL (blog/movimento-blog.md). Passe 3, 2026-09-23.
 *
 * Os mesmos três verbos da home, com dose de vale, e a mesma caligrafia de `lib/camera.ts` (máscara
 * de linha, trilho curto, camada em altura de tela). Cada peça aqui é uma ÂNCORA escondida que acha
 * a própria seção e anima só o que o movimento-blog.md dá ao GSAP: nunca o `li` da grade (é do
 * Motion), nunca o cordão do abajur (Motion), nunca nada DENTRO da coluna de texto do artigo.
 *
 * Reduced-motion: tudo no estado final, e o fio de leitura continua marcando o progresso sem
 * interpolação (ele é informação, não enfeite).
 */

const CURVA = "power3.out";

/** Corta um título em linhas por máscara, com o espaço inflexível das órfãs preservado. */
function cortar(el: HTMLElement, aoCortar: (linhas: Element[]) => gsap.core.Animation | null | void) {
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    linesClass: "camera-linha",
    autoSplit: true,
    reduceWhiteSpace: false,
    onSplit: (self) => aoCortar(self.lines) ?? undefined,
  });
}

/**
 * PICO 1, O TOPO DO JOURNAL. Ato 1, ao chegar: o símbolo se desenha no canto (é o
 * `SimboloDesenhado`, dono do próprio desenho) enquanto as linhas do título sobem da máscara e o
 * apoio aparece. Ato 2, na primeira rolagem: o símbolo recua quase parado (fundo), o título sobe
 * no ritmo do meio e o "Start here" chega na frente, mais rápido.
 * RESPOSTA (a única do pico): o traço do símbolo engrossa com a VELOCIDADE da rolagem e volta ao
 * repouso quando o dedo para. Receita de pico e volta: registra só o pico e um tween devolve.
 */
export function CameraTopoJournal() {
  const ancora = useRef<HTMLSpanElement | null>(null);
  useGSAP(() => {
    const topo = ancora.current?.closest<HTMLElement>(".journal-topo");
    if (!topo) return;
    const titulo = topo.querySelector<HTMLElement>(".journal-titulo");
    const apoio = gsap.utils.toArray<HTMLElement>(".journal-etiqueta, .journal-intro", topo);
    const marca = topo.querySelector<HTMLElement>(".journal-marca");
    const texto = topo.querySelector<HTMLElement>(".journal-topo-texto");
    const destaque = document.querySelector<HTMLElement>(".start-here-card");
    const traco = marca?.querySelector<SVGSVGElement>("svg");

    const mm = gsap.matchMedia();
    mm.add(
      {
        anima: "(prefers-reduced-motion: no-preference)",
        estreito: "(max-width: 767px)",
      },
      (ctx) => {
        const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };
        if (!anima) return;

        const corte = titulo
          ? cortar(titulo, (linhas) =>
              gsap.fromTo(
                linhas,
                { yPercent: 106 },
                { yPercent: 0, duration: 1.1, ease: CURVA, stagger: 0.09, delay: 0.15 },
              ),
            )
          : null;
        gsap.fromTo(apoio, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9, ease: CURVA, delay: 0.55, stagger: 0.12 });

        if (marca) {
          camada(marca, 2, topo, estreito);
          /* ATO 2, medido (sem ele o topo tinha um tipo de movimento e 63% da travessia morta): o
             símbolo RECUA enquanto a página desce, menor e mais apagado, como o que fica para trás.
             Escala e opacidade no filho (o SVG); o deslocamento é do invólucro: canais separados. */
          const desenho = marca.querySelector("svg");
          if (desenho) {
            gsap.fromTo(
              desenho,
              { scale: 1, opacity: 1 },
              {
                scale: 0.86,
                opacity: 0.35,
                transformOrigin: "70% 30%",
                ease: "none",
                scrollTrigger: { trigger: topo, start: "top top", end: "bottom top", scrub: 0.6 },
              },
            );
          }
        }
        if (texto) camada(texto, 7, topo, estreito);
        if (destaque) camada(destaque, 8, destaque, estreito);

        if (traco) {
          const base = parseFloat(traco.getAttribute("stroke-width") ?? "1") || 1;
          const pico = { v: base };
          const aplicar = () => traco.setAttribute("stroke-width", pico.v.toFixed(3));
          ScrollTrigger.create({
            trigger: topo,
            start: "top top",
            end: "bottom top",
            onUpdate: (self) => {
              const forca = Math.min(Math.abs(self.getVelocity()) / 2600, 1);
              const alvo = base * (1 + 0.46 * forca);
              if (alvo <= pico.v) return;
              gsap.to(pico, { v: alvo, duration: 0.18, ease: "power2.out", overwrite: true, onUpdate: aplicar });
              gsap.to(pico, { v: base, duration: 0.9, ease: "power2.inOut", delay: 0.22, onUpdate: aplicar });
            },
          });
        }

        return () => corte?.revert();
      },
    );
  });
  return <span ref={ancora} hidden aria-hidden="true" />;
}

/**
 * PICO 2 (e a chegada da autoria na listagem): "From Bruna". O campo de papel-2 SOBE de baixo para
 * cima e entrega a seção (verbo 3, uma vez por página), o arco se desenha em volta da foto em
 * scrub (é aqui que termina a linha que acompanhou a leitura), o título entra por linha, o corpo
 * aparece uma vez e o quadro da foto anda na frente (8vh).
 * O campo anima a variável `--campo` (0 a 100); a forma do recorte fica no CSS.
 */
export function CenaFromBruna() {
  const ancora = useRef<HTMLSpanElement | null>(null);
  useGSAP(() => {
    const secao = ancora.current?.closest<HTMLElement>(".from-bruna");
    if (!secao) return;
    const campo = secao.querySelector<HTMLElement>(".campo-leitura");
    const arco = secao.querySelector<SVGPathElement>(".from-bruna-arco-traco");
    const titulo = secao.querySelector<HTMLElement>(".from-bruna-titulo");
    const quadro = secao.querySelector<HTMLElement>(".from-bruna-quadro");
    const corpo = gsap.utils.toArray<HTMLElement>(".from-bruna-texto > p, .from-bruna-botao", secao);

    const mm = gsap.matchMedia();
    mm.add(
      {
        anima: "(prefers-reduced-motion: no-preference)",
        reduzido: "(prefers-reduced-motion: reduce)",
        estreito: "(max-width: 767px)",
      },
      (ctx) => {
        const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };
        if (!anima) {
          if (campo) gsap.set(campo, { "--campo": 100 });
          if (arco) gsap.set(arco, { drawSVG: "0% 100%" });
          return;
        }
        if (campo) {
          gsap.fromTo(
            campo,
            { "--campo": 0 },
            {
              "--campo": 100,
              ease: "none",
              scrollTrigger: { trigger: secao, start: "top bottom", end: "top 35%", scrub: 0.6 },
            },
          );
        }
        if (arco) {
          gsap.fromTo(
            arco,
            { drawSVG: "50% 50%" },
            {
              drawSVG: "0% 100%",
              ease: "none",
              scrollTrigger: { trigger: quadro ?? secao, start: "top 85%", end: "center 55%", scrub: 0.6 },
            },
          );
        }
        const corte = titulo ? cortar(titulo, (linhas) => tituloEmTrilho(linhas, titulo)) : null;
        corpoUmaVez(corpo);
        /* ATO 2 (medido: sem ele, 38% da travessia ficava morta depois do arco fechar): a coluna de
           texto (meio) e a foto (frente) se separam até a seção sair, em velocidades diferentes */
        if (quadro) camada(quadro, 8, secao, estreito);
        const texto = secao.querySelector<HTMLElement>(".from-bruna-texto");
        if (texto) camada(texto, 4, secao, estreito);
        return () => corte?.revert();
      },
    );
  });
  return <span ref={ancora} hidden aria-hidden="true" />;
}

/**
 * O TÍTULO de "Keep reading" entra por linha. Os CARDS não são mais daqui: entram pelo
 * `EntraNaVista` (Motion, quando aparecem na tela). O lote do ScrollTrigger escondia cards que
 * nunca voltavam depois de filtrar ou de trocar de página.
 */
export function CardsQueEntram({ escopo }: { escopo: string }) {
  const ancora = useRef<HTMLSpanElement | null>(null);
  useGSAP(() => {
    const raiz = ancora.current?.closest<HTMLElement>(escopo);
    if (!raiz) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const titulo = raiz.querySelector<HTMLElement>(".keep-reading-titulo");
      const corte = titulo ? cortar(titulo, (linhas) => tituloEmTrilho(linhas, titulo)) : null;
      return () => corte?.revert();
    });
  });
  return <span ref={ancora} hidden aria-hidden="true" />;
}

/**
 * A CHEGADA DO ARTIGO: o título sobe da máscara por linha, a chamada, a autoria e a capa aparecem
 * em seguida, e a IMAGEM dentro da capa anda devagar (4vh, frente) enquanto ela passa. A capa em
 * si fica parada: é ela que carrega o nome da passagem da listagem para o artigo.
 */
export function ChegadaDoArtigo() {
  const ancora = useRef<HTMLSpanElement | null>(null);
  useGSAP(() => {
    const artigo = ancora.current?.closest<HTMLElement>(".artigo");
    if (!artigo) return;
    const titulo = artigo.querySelector<HTMLElement>(".artigo-titulo");
    const resto = gsap.utils.toArray<HTMLElement>(".artigo-chamada, .artigo-autoria", artigo);
    const capa = artigo.querySelector<HTMLElement>(".artigo-capa .capa");
    const miolo = capa ? gsap.utils.toArray<Element>(".capa-frase, .capa-linha", capa) : [];

    const mm = gsap.matchMedia();
    mm.add(
      { anima: "(prefers-reduced-motion: no-preference)", estreito: "(max-width: 767px)" },
      (ctx) => {
        const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };
        if (!anima) return;
        const corte = titulo
          ? cortar(titulo, (linhas) =>
              gsap.fromTo(linhas, { yPercent: 106 }, { yPercent: 0, duration: 1, ease: CURVA, stagger: 0.08, delay: 0.1 }),
            )
          : null;
        gsap.fromTo(resto, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: CURVA, delay: 0.45, stagger: 0.1 });
        if (capa && miolo.length) {
          gsap.fromTo(
            miolo,
            { y: 0 },
            {
              y: () => -window.innerHeight * 0.04 * (estreito ? 0.5 : 1),
              ease: "none",
              scrollTrigger: { trigger: capa, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
            },
          );
        }
        return () => corte?.revert();
      },
    );
  });
  return <span ref={ancora} hidden aria-hidden="true" />;
}

/**
 * O FIO DE LEITURA (o elemento vivo no artigo): um fio de 1,5px em tinta que cresce com o progresso
 * da leitura do CORPO do artigo, do primeiro ao último parágrafo, e se apaga quando a leitura
 * termina, entregando a linha ao arco em volta da Bruna. Na margem da coluna no desktop (vertical),
 * logo abaixo do topo da tela no celular (horizontal). Ele fica FORA da coluna de texto: nada se
 * move onde se lê. Reduced-motion: marca o progresso na hora, sem interpolação.
 */
export function FioDeLeitura() {
  const raiz = useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      const leitura = raiz.current?.closest<HTMLElement>(".artigo-leitura");
      const corpo = leitura?.querySelector<HTMLElement>(".prosa");
      const vertical = raiz.current?.querySelector<HTMLElement>(".fio-vertical");
      const topo = raiz.current?.querySelector<HTMLElement>(".fio-topo");
      if (!corpo || !vertical || !topo) return;

      const mm = gsap.matchMedia();
      mm.add({ anima: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        const { anima } = ctx.conditions as { anima: boolean };
        gsap.set(vertical, { scaleY: 0 });
        gsap.set(topo, { scaleX: 0, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: corpo,
          start: "top 70%",
          end: "bottom 70%",
          scrub: anima ? 0.4 : true,
          animation: gsap
            .timeline()
            .to(vertical, { scaleY: 1, ease: "none" }, 0)
            .to(topo, { scaleX: 1, ease: "none" }, 0),
          onToggle: (self) => gsap.to(topo, { autoAlpha: self.isActive ? 1 : 0, duration: anima ? 0.4 : 0 }),
          onLeave: () => gsap.to(vertical, { opacity: 0, duration: anima ? 0.6 : 0 }),
          onEnterBack: () => gsap.to(vertical, { opacity: 1, duration: anima ? 0.3 : 0 }),
        });
      });
    },
    { scope: raiz },
  );
  return (
    <div ref={raiz} className="fio-de-leitura" aria-hidden="true">
      <span className="fio-vertical" />
      <span className="fio-topo" />
    </div>
  );
}
