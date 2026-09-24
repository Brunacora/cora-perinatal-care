"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Inteiras } from "../Enfase";
import { rolarPara } from "../MovimentoProvider";
import { Seta } from "./Seta";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, SplitText);

export type ItemAula = {
  chave: string;
  /** a numeração do DESKTOP, que conta a abertura: a primeira aula é a 02 de 06 */
  numero: string;
  /** a numeração do CELULAR, que conta só as aulas: a primeira aula é a 01 de 05.
      Pedido da Bruna (2026-09-23): "no celular, iniciar a numeração com a primeira aula
      oferecida". As duas ficam sempre na marcação e quem escolhe é o CSS, que é a mesma regra do
      "Read more" da história: assim não existe estado para piscar na hidratação. */
  numeroCelular: string;
  nome: string;
  preco: string;
  intro: string;
  foto: { src: string; alt: string; posicao?: string };
  detalhe: ReactNode;
};

/* O que o capítulo mostra em cada tempo, conforme o número de tempos em que ele se divide (ver o
   comentário do componente). As partes de tempos diferentes ocupam a mesma área da grade
   (globals.css). A abertura é o capítulo mais denso (923 caracteres sem foto) e é a única que
   pode pedir três tempos, numa tela muito baixa. */
const TEMPOS: Record<"aula" | "abertura", Record<number, string[]>> = {
  aula: {
    2: [".cap-quadro, .cap-intro-texto", ".cap-detalhe"],
  },
  abertura: {
    2: [
      ".cap-abertura, .cap-detalhe > p:nth-child(1)",
      ".cap-detalhe > p:nth-child(2), .cap-detalhe > p:nth-child(3), .cap-botao",
    ],
    3: [
      ".cap-abertura, .cap-detalhe > p:nth-child(1)",
      ".cap-detalhe > p:nth-child(2)",
      ".cap-detalhe > p:nth-child(3), .cap-botao",
    ],
  },
};

/** A altura que o conteúdo do capítulo ocupa de verdade: do topo do primeiro elemento ao pé do último. */
function alturaDoConteudo(cap: HTMLElement) {
  let topo = Infinity;
  let fundo = -Infinity;
  cap.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.height) return;
    topo = Math.min(topo, r.top);
    fundo = Math.max(fundo, r.bottom);
  });
  return fundo > topo ? fundo - topo : 0;
}

/**
 * A cena das aulas, versão 11 (2026-09-11): "o palco", em TEMPOS quando a tela é baixa.
 *
 * A CONTA que decide a estrutura: esta seção tem 4.235 caracteres de copy intocável. Não existe
 * layout que mostre isso numa tela só rolando normal. A saída profissional é prender a cena e
 * transformar a rolagem em CAPÍTULOS: a página não cresce e cada capítulo aparece inteiro.
 *
 * O QUE A VERSÃO 11 CONSERTA, medido: o palco tinha sido afinado para caber numa tela de 812px de
 * altura, e abaixo disso falhava sem ninguém ver. A 740px (Android comum) todo capítulo passava da
 * cena e perdia o fim, de 26 a 59px de copy cortada. No iPhone SE (667px) a cena desistia de
 * prender e a seção virava uma lista parada (o Gabriel viu). Num notebook de 720px o capítulo de
 * abertura passava 12px. Agora a decisão é MEDIDA na tela de verdade: o capítulo que não cabe
 * inteiro se divide em dois tempos, no mesmo lugar e com a mesma animação. Na aula, primeiro a
 * foto, o nome e a apresentação; depois, o que ela explora. Na abertura, primeiro a frase e o
 * primeiro parágrafo; depois o resto e o botão. Só quando nem em dois tempos cabe (celular deitado,
 * por exemplo) a seção vira fluxo, como no reduced-motion. Serve também para a copy em português,
 * que costuma ser mais longa: a medida decide, não um número fixo.
 *
 * O ERRO QUE A VERSÃO 10 CONSERTOU, e que continua valendo: as listas de foto, moldura e nome têm
 * um elemento por aula, e o capítulo zero é a abertura. Cada peça é procurada DENTRO do capítulo
 * dela, então não existe índice a errar.
 *
 * Posse: GSAP. Sem hover, sem botão de "mais", sem diálogo: nada abre, então nada estoura.
 */
export function CenaAulas({
  titulo,
  capitulo0,
  itens,
  rotuloMarcas,
  rotuloAbertura,
  rotuloAnterior,
  rotuloProximo,
  cta,
  ctaHref,
}: {
  titulo: ReactNode;
  capitulo0: ReactNode;
  itens: ItemAula[];
  /** o atalho discreto do topo, à mão em todos os capítulos */
  cta: string;
  ctaHref: string;
  /** o nome da fila de marcas e o da marca da abertura, para o leitor de tela, no idioma da página */
  rotuloMarcas: string;
  rotuloAbertura: string;
  /** as duas setas de capítulo. Ver a nota em `Seta.tsx`: pedido da cliente, em áudio. */
  rotuloAnterior: string;
  rotuloProximo: string;
}) {
  const secao = useRef<HTMLElement | null>(null);
  const palco = useRef<HTMLDivElement | null>(null);

  /* O SplitText corta o nome em LINHAS, e linha depende da fonte carregada no momento do corte.
     Cortando antes de a Gambetta chegar, as caixas da máscara nascem com a medida da fonte de
     reserva e depois cortam palavra no meio. Por isso o contexto espera as fontes e refaz. */
  const [fontesProntas, setFontesProntas] = useState(false);
  useEffect(() => {
    let vivo = true;
    const pronto = () => {
      if (vivo) setFontesProntas(true);
    };
    if (document.fonts) document.fonts.ready.then(pronto).catch(pronto);
    else pronto();
    return () => {
      vivo = false;
    };
  }, []);

  /* A TELA MUDOU DE MEDIDA (virar o aparelho, redimensionar a janela): a conta de quais capítulos
     se dividem é refeita. Em tela de toque só a LARGURA conta: a altura muda a cada rolagem com a
     barra de endereço, e o palco mede 100svh, que não muda com ela. */
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    const toque = window.matchMedia("(pointer: coarse)");
    const medida = () =>
      `${document.documentElement.clientWidth}x${toque.matches ? 0 : window.innerHeight}`;
    let atual = medida();
    let espera = 0;
    const aoMudar = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(() => {
        const nova = medida();
        if (nova === atual) return;
        atual = nova;
        setVersao((v) => v + 1);
      }, 250);
    };
    window.addEventListener("resize", aoMudar);
    return () => {
      window.removeEventListener("resize", aoMudar);
      window.clearTimeout(espera);
    };
  }, []);

  useGSAP(
    () => {
      const raiz = secao.current;
      const stage = palco.current;
      if (!raiz || !stage) return;

      const capitulos = gsap.utils.toArray<HTMLElement>(".cap", raiz);
      const marcas = gsap.utils.toArray<HTMLElement>(".palco-marca", raiz);
      const setaAnterior = raiz.querySelector<HTMLButtonElement>('[data-seta="anterior"]');
      const setaProxima = raiz.querySelector<HTMLButtonElement>('[data-seta="proxima"]');
      const barra = raiz.querySelector<HTMLElement>(".palco-barra-ativa");
      const borboletas = gsap.utils.toArray<HTMLElement>(".borboleta", raiz);
      const cena = raiz.querySelector<HTMLElement>(".palco-cena");
      const n = capitulos.length;
      if (!n || !cena) return;

      /* O ALVO DA NAVEGAÇÃO, separado do que está na tela. Sem ele, dois cliques seguidos na seta
         calculavam os dois a partir do MESMO ponto, porque a rolagem ainda estava a caminho. A
         janela de 1,4s é o tempo da viagem: passado isso, quem manda volta a ser o que a pessoa
         está vendo.

         O ALVO É UM PASSO, NÃO UM CAPÍTULO (Bruna, 2026-09-24: "quando clica nas setas não vai pra
         próxima página, vai direto pra próxima aula"). Uma aula que não cabe na tela se divide em
         dois tempos, e a seta andava de capítulo em capítulo, caindo sempre no PRIMEIRO tempo do
         seguinte. Medido a 390x844: as cinco aulas se dividiam em dois, e em nenhuma delas a lista
         do "Together we'll explore" chegava a acender para quem navegava pelas setas. */
      let alvoPasso = 0;
      let viagemAte = 0;

      /* Cada peça é procurada DENTRO do capítulo. Sem índice, sem deslocamento possível. */
      const pecaDo = <T extends Element>(i: number, sel: string) =>
        capitulos[i]?.querySelector<T>(sel) ?? null;
      const fotoDo = (i: number) => pecaDo<HTMLElement>(i, ".cap-foto");
      const imgDo = (i: number) => pecaDo<HTMLElement>(i, ".cap-foto img");
      const linhaDo = (i: number) => pecaDo<SVGPathElement>(i, ".cap-linha");
      const itensDe = (i: number) =>
        gsap.utils.toArray<HTMLElement>(".lista li, .cap-parceiros", capitulos[i]);
      const tipoDe = (i: number) => (capitulos[i].classList.contains("cap-intro") ? "abertura" : "aula");
      /* as partes do tempo `tempo` de um capítulo dividido em `total` tempos */
      const partes = (i: number, tempo: number, total: number) => {
        const sel = TEMPOS[tipoDe(i)][total]?.[tempo];
        return sel ? gsap.utils.toArray<HTMLElement>(sel, capitulos[i]) : [];
      };

      const naoNulo = <T,>(v: T | null): v is T => v !== null;
      const todasFotos = capitulos.map((_, i) => fotoDo(i)).filter(naoNulo);
      const todasImgs = capitulos.map((_, i) => imgDo(i)).filter(naoNulo);
      const todasLinhas = capitulos.map((_, i) => linhaDo(i)).filter(naoNulo);

      /* A CORTINA DA FOTO É UMA VARIÁVEL (`--cortina`, usada no `clip-path` do globals.css). O
         recorte precisa levar o raio junto, senão o Safari do iPhone não segura a foto com zoom
         dentro da moldura; e o raio não pode entrar no valor animado, senão o GSAP pula em vez de
         deslizar. Com a variável, o CSS guarda o raio e aqui anda só o número. */
      const ABERTA = "0%";
      const FECHADA = "100%";

      /* A LINHA DA MOLDURA SE REDESENHA QUANDO A CAIXA MUDA DE TAMANHO. Ela é um caminho de SVG
         calculado a partir da medida do quadro: se a caixa muda depois (o Safari do iPhone refaz a
         altura quando a barra de endereço some), a linha fica com a medida velha e aparece menor
         que a foto. */
      const observador = new ResizeObserver(() => desenharArcos());

      /* A linha da marca em volta de cada foto, desenhada no tamanho real do quadro. */
      const desenharArcos = () => {
        /* LÊ TUDO E SÓ DEPOIS ESCREVE TUDO. Lendo a medida de um capítulo depois de ter escrito o
           caminho do anterior, o navegador é obrigado a refazer o layout a cada volta: o trace num
           celular com processador seis vezes mais lento acusou 239ms de reflow forçado. Duas
           passadas custam uma medida só. */
        const medidas = capitulos.map((_, i) => {
          const arco = pecaDo<HTMLElement>(i, ".cap-arco");
          if (!arco) return null;
          const cs = getComputedStyle(arco);
          return {
            w: arco.offsetWidth,
            h: arco.offsetHeight,
            topo: cs.borderTopLeftRadius,
            base: cs.borderBottomLeftRadius,
          };
        });
        capitulos.forEach((_, i) => {
          const caminho = linhaDo(i);
          const svg = pecaDo<SVGSVGElement>(i, ".cap-linha-svg");
          const medida = medidas[i];
          if (!caminho || !svg || !medida) return;
          const w = medida.w;
          const h = medida.h;
          if (!w || !h) return;

          /* O raio vem do CSS, não de um número fixo: no celular a foto é um retângulo de topo
             suave e no desktop é o arco da logo. Ler o valor, resolver a porcentagem e aplicar o
             mesmo escalonamento do navegador é o que mantém a linha colada na foto. */
          const ler = (v: string, base: number) =>
            v.trim().endsWith("%") ? (parseFloat(v) / 100) * base : parseFloat(v) || 0;
          const par = (prop: string) => {
            const lados = prop.split(" ");
            return [ler(lados[0], w), ler(lados[1] ?? lados[0], h)] as const;
          };
          const [txBruto, tyBruto] = par(medida.topo);
          const [bxBruto, byBruto] = par(medida.base);
          const escala = Math.min(
            1,
            txBruto ? w / (2 * txBruto) : 1,
            tyBruto + byBruto ? h / (tyBruto + byBruto) : 1,
            bxBruto ? w / (2 * bxBruto) : 1,
          );
          const o = 0.75;
          const tx = Math.max(0, txBruto * escala - o);
          const ty = Math.max(0, tyBruto * escala - o);
          const bx = Math.max(0, bxBruto * escala - o);
          const by = Math.max(0, byBruto * escala - o);
          const d = [
            `M ${o} ${h - by - o}`,
            `V ${ty + o}`,
            `A ${tx} ${ty} 0 0 1 ${tx + o} ${o}`,
            `H ${w - tx - o}`,
            `A ${tx} ${ty} 0 0 1 ${w - o} ${ty + o}`,
            `V ${h - by - o}`,
            `A ${bx} ${by} 0 0 1 ${w - bx - o} ${h - o}`,
            `H ${bx + o}`,
            `A ${bx} ${by} 0 0 1 ${o} ${h - by - o}`,
            `Z`,
          ].join(" ");
          caminho.setAttribute("d", d);
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        });
      };

      /* `i` é o capítulo, que é o que as MARCAS mostram; `k` é o passo, que é o que as SETAS
         andam. Os dois são diferentes quando uma aula se divide em dois tempos, e é essa distinção
         que conserta o pulo. `ultimo` é o índice do último passo, para saber quando a seta da
         frente não tem mais para onde ir. */
      const acender = (i: number, k: number, ultimo: number) => {
        marcas.forEach((m, j) => {
          m.classList.toggle("esta-ativa", j === i);
          m.setAttribute("aria-selected", j === i ? "true" : "false");
        });
        raiz.dataset.capitulo = String(i);
        if (performance.now() > viagemAte) alvoPasso = k;
        /* a seta que não tem para onde ir fica desabilitada, em vez de sumir: botão que aparece e
           some muda o layout da barra a cada capítulo */
        if (setaAnterior) setaAnterior.disabled = k <= 0;
        if (setaProxima) setaProxima.disabled = k >= ultimo;
      };

      /* O nome de cada aula cortado em linhas, para subir por baixo de uma máscara. É o gesto do
         TrueKind: a tipografia carrega, a imagem acompanha. O capítulo zero não tem nome. */
      const cortes = capitulos.map((c) => {
        const el = c.querySelector<HTMLElement>(".cap-nome");
        return el
          ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras */
            new SplitText(el, { type: "lines", linesClass: "cap-linha-nome", mask: "lines", reduceWhiteSpace: false })
          : null;
      });
      const linhasDe = (i: number) => cortes[i]?.lines ?? [];

      /* QUANTOS TEMPOS CADA CAPÍTULO PEDE. Mede com o palco montado, antes de qualquer animação:
         cada capítulo inteiro primeiro; o que passa da altura da cena é dividido em dois, e a
         abertura, se ainda passar, em três. Devolve null quando nem assim cabe. */
      const medirTempos = (altura: number): number[] | null => {
        /* A folga cobre o arredondamento de subpixel. O capítulo em dois tempos PREENCHE a cena
           por construção (a linha da foto é flexível), e sem folga um pixel de arredondamento
           mandava a seção inteira para o fluxo: medido no iPhone SE, 502px numa cena de 501. */
        const folga = 4;
        const cabe = (c: HTMLElement, q: number) => {
          if (q === 1) delete c.dataset.tempos;
          else c.dataset.tempos = String(q);
          return alturaDoConteudo(c) <= altura + folga;
        };
        const tempos: number[] = [];
        for (let i = 0; i < capitulos.length; i++) {
          const opcoes = [1, ...Object.keys(TEMPOS[tipoDe(i)]).map(Number)];
          const q = opcoes.find((o) => cabe(capitulos[i], o));
          if (!q) return null;
          tempos.push(q);
        }
        /* AS AULAS ANDAM NO MESMO PASSO. Se uma aula pede dois tempos, todas vão a dois: com as
           aulas alternando entre um e dois tempos, a foto mudava de tamanho a cada capítulo e o
           ritmo da rolagem mancava (medido a 360x740: 1, 2, 1, 2, 1). A abertura tem desenho
           próprio e fica de fora. */
        const passo = Math.max(...tempos.filter((_, i) => tipoDe(i) === "aula"));
        for (let i = 0; i < capitulos.length; i++) {
          if (tipoDe(i) !== "aula" || tempos[i] === passo) continue;
          if (!cabe(capitulos[i], passo)) return null;
          tempos[i] = passo;
        }
        return tempos;
      };

      /* A LETRA DOS TEMPOS. Dividido, o capítulo tem a cena só para si e a ementa sobe à letra de
         leitura (globals.css). Se com ela algum capítulo não couber, a conta é refeita com a letra
         compacta dos capítulos inteiros PARA TODOS, para as aulas não ficarem com letras
         diferentes entre si. Medido: é o que acontece no iPhone SE com as barras do Safari à vista
         (cena de 387px). */
      const escolherTempos = (): number[] | null => {
        raiz.dataset.modo = "palco";
        capitulos.forEach((c) => delete c.dataset.tempos);
        const altura = cena.clientHeight;
        if (altura < 240) return null;
        for (const letra of ["leitura", "compacta"]) {
          raiz.dataset.letra = letra;
          capitulos.forEach((c) => delete c.dataset.tempos);
          const tempos = medirTempos(altura);
          if (tempos) return tempos;
        }
        return null;
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
          estreito: "(max-width: 699px)",
        },
        (ctx) => {
          const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };

          /* O VOO CONTÍNUO. Não depende da rolagem: mesmo com a página parada as borboletas
             batem as asas, sobem e descem e giram um pouco. É isso que as faz parecer vivas em
             todos os capítulos, e não só no instante da troca. A deriva ligada à rolagem entra
             por cima, escrevendo yPercent e xPercent, que são componentes separados da mesma
             transformação: as duas convivem sem brigar. */
          const voos: gsap.core.Tween[] = [];
          const bater = () => {
            borboletas.forEach((b, i) => {
              const asa = b.querySelector(".borboleta-asa");
              if (asa) {
                voos.push(
                  gsap.to(asa, {
                    scaleX: 0.55,
                    duration: 0.26 + i * 0.06,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                    transformOrigin: "50% 50%",
                  }),
                  gsap.to(asa, {
                    rotation: i === 0 ? 7 : -8,
                    duration: 3.4 + i * 0.7,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                    transformOrigin: "50% 50%",
                  }),
                );
              }
              voos.push(
                gsap.fromTo(
                  b,
                  { y: i === 0 ? -10 : 8 },
                  {
                    y: i === 0 ? 12 : -10,
                    duration: 3.8 + i * 0.9,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                  },
                ),
              );
            });
            /* FORA DA TELA, AS BORBOLETAS PARAM. Animação infinita rodando numa seção que ninguém
               está vendo é quadro perdido, e no celular isso aparece como travada ao passar pelas
               seções (o Gabriel sentiu no iPhone em 2026-09-11). */
            const naTela = ScrollTrigger.create({
              trigger: raiz,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self) => voos.forEach((t) => (self.isActive ? t.resume() : t.pause())),
            });
            if (!naTela.isActive) voos.forEach((t) => t.pause());
          };

          /* sem animação, ou tela baixa demais até para dois tempos: capítulos em fluxo */
          const emFluxo = () => {
            raiz.dataset.modo = "fluxo";
            capitulos.forEach((c) => delete c.dataset.tempos);
            delete raiz.dataset.letra;
            desenharArcos();
            gsap.set(capitulos, { opacity: 1, y: 0 });
            gsap.set(todasFotos, { "--cortina": ABERTA });
            gsap.set(todasImgs, { scale: 1 });
            cortes.forEach((c) => c && gsap.set(c.lines, { yPercent: 0, opacity: 1 }));
            gsap.set(".lista li, .cap-parceiros", { opacity: 1 });
            gsap.set(todasLinhas, { drawSVG: "0% 100%" });
            if (barra) gsap.set(barra, { scaleX: 1 });
            /* em fluxo não existe passo: tudo já está na tela, e as duas setas ficam desabilitadas */
            acender(0, 0, 0);
            if (anima) bater();
          };

          const tempos = anima ? escolherTempos() : null;
          if (!tempos) {
            emFluxo();
            return;
          }

          desenharArcos();
          bater();

          /* A sequência de passos da cena: um por tempo de cada capítulo */
          const passos: { cap: number; tempo: number }[] = [];
          tempos.forEach((q, i) => {
            for (let b = 0; b < q; b++) passos.push({ cap: i, tempo: b });
          });
          const unidades = Math.max(1, passos.length - 1);
          /* QUANTA ROLAGEM CADA PASSO RECEBE. Era 0,56 de tela quando há divisão, e 0,56 é menos
             do que o dedo anda num gesto só: o conteúdo passava mais rápido que a mão e a Bruna
             viu "pular a tela ao invés de aparecer todas as info" (24/09). Subiu para 0,78, a
             mesma ordem de grandeza que consertou a seção 6 (lá é uma tela inteira por tempo).
             Não vai a 1,0 porque aqui são 11 passos e não 4: a conta é 11 x 0,78, e cada décimo a
             mais estica a cena presa em mais de uma tela no celular. */
          const porPasso = passos.length > n ? 0.78 : 0.64;

          gsap.set(capitulos, { opacity: 0, y: 26, pointerEvents: "none" });
          gsap.set(capitulos[0], { opacity: 1, y: 0, pointerEvents: "auto" });
          gsap.set(todasFotos, { "--cortina": FECHADA });
          gsap.set(todasImgs, { scale: 1.1 });
          gsap.set(todasLinhas, { drawSVG: "0% 0%" });
          cortes.forEach((c) => c && gsap.set(c.lines, { yPercent: 106, opacity: 0 }));
          gsap.set(".lista li, .cap-parceiros", { opacity: 0 });
          /* nos capítulos divididos, todo tempo depois do primeiro começa escondido */
          tempos.forEach((q, i) => {
            for (let b = 1; b < q; b++) {
              const p = partes(i, b, q);
              if (p.length) gsap.set(p, { opacity: 0, y: 12 });
            }
          });
          /* o capítulo 0 é a abertura e não tem lista nem parceiros: alvo vazio faz o GSAP
             avisar no console, e aviso no console é bug que ninguém vê até virar bug que todos
             veem. Só mexe em quem existe. */
          const itens0 = itensDe(0);
          if (itens0.length && tempos[0] === 1) gsap.set(itens0, { opacity: 1 });
          const ultimoPasso = passos.length - 1;
          acender(0, 0, ultimoPasso);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => "+=" + window.innerHeight * porPasso * unidades,
              pin: stage,
              pinSpacing: true,
              anticipatePin: 1,
              /* esta é a seção 4: mede DEPOIS da seção 3, que tem prioridade 2 */
              refreshPriority: 1,
              scrub: 0.5,
              invalidateOnRefresh: true,
              onRefresh: desenharArcos,
              /* SEM encaixe (snap): ele escreve a posição da rolagem por conta própria e briga
                 com a Lenis, que também escreve. O resultado é a cena saltando de capítulo. */
              onUpdate: (self) => {
                const k = Math.min(ultimoPasso, Math.max(0, Math.round(self.progress * unidades)));
                acender(passos[k]?.cap ?? 0, k, ultimoPasso);
              },
            },
          });

          if (barra) tl.fromTo(barra, { scaleX: 0 }, { scaleX: 1, duration: unidades }, 0);

          /* A DERIVA LIGADA À ROLAGEM é CURTA de propósito e MEDIDA: com ela, a borboleta da
             direita nunca encosta no topo da tela no último capítulo e a da esquerda nunca invade
             o card. O que muda com a rolagem é só a altura e a inclinação. */
          const amplitude = estreito ? 12 : 20;
          borboletas.forEach((b, i) => {
            const fundo = i === 0;
            tl.fromTo(
              b,
              {
                yPercent: fundo ? amplitude : -amplitude,
                xPercent: fundo ? -6 : 6,
                rotation: fundo ? -6 : 7,
              },
              {
                yPercent: fundo ? -amplitude : amplitude,
                xPercent: fundo ? 8 : -8,
                rotation: fundo ? 8 : -6,
                duration: unidades,
              },
              0,
            );
          });

          for (let k = 1; k < passos.length; k++) {
            const t = k - 1;
            const de = passos[k - 1];
            const para = passos[k];

            /* O SEGUNDO TEMPO do mesmo capítulo: o que foi lido sai por cima, o resto entra por
               baixo no mesmo lugar, e a ementa acende item a item. O nome e o número ficam. */
            if (de.cap === para.cap) {
              const q = tempos[de.cap];
              const sai = partes(de.cap, de.tempo, q);
              const entra = partes(de.cap, para.tempo, q);
              if (sai.length) tl.to(sai, { opacity: 0, y: -12, duration: 0.26 }, t + 0.08);
              if (entra.length) {
                tl.fromTo(entra, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, t + 0.3);
              }
              /* a ementa acende item a item no tempo em que ela aparece */
              const itens = entra.some((el) => el.classList.contains("cap-detalhe")) ? itensDe(de.cap) : [];
              if (itens.length) {
                tl.fromTo(itens, { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.035 }, t + 0.4);
              }
              continue;
            }

            const anterior = de.cap;
            const i = para.cap;

            /* sai o capítulo anterior */
            tl.to(capitulos[anterior], { opacity: 0, y: -26, duration: 0.3, pointerEvents: "none" }, t + 0.08);
            /* o capítulo zero não tem nome cortado: passar lista vazia ao GSAP gera aviso e
               não anima nada */
            const saiNome = linhasDe(anterior);
            if (saiNome.length) {
              tl.to(saiNome, { yPercent: -106, opacity: 0, duration: 0.24 }, t + 0.08);
            }
            const linhaSai = linhaDo(anterior);
            if (linhaSai) tl.to(linhaSai, { drawSVG: "0% 0%", duration: 0.2 }, t + 0.1);

            /* entra o novo: o bloco, a moldura da marca desenhando, a foto por cortina, o nome
               linha a linha e, quando o capítulo é de um tempo só, a ementa acendendo */
            tl.fromTo(
              capitulos[i],
              { opacity: 0, y: 26 },
              { opacity: 1, y: 0, duration: 0.34, pointerEvents: "auto" },
              t + 0.4,
            );

            const linhaEntra = linhaDo(i);
            if (linhaEntra) {
              tl.fromTo(linhaEntra, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.5 }, t + 0.42);
            }
            const foto = fotoDo(i);
            if (foto) {
              tl.fromTo(
                foto,
                { "--cortina": FECHADA },
                { "--cortina": ABERTA, duration: 0.46 },
                t + 0.42,
              );
              const img = imgDo(i);
              if (img) tl.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 0.76 }, t + 0.42);
            }
            const entraNome = linhasDe(i);
            if (entraNome.length) {
              tl.fromTo(
                entraNome,
                { yPercent: 106, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.28, stagger: 0.07 },
                t + 0.5,
              );
            }
            const itens = itensDe(i);
            if (itens.length && tempos[i] === 1) {
              tl.fromTo(itens, { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.035 }, t + 0.6);
            }
          }

          /* A VIAGEM É SEMPRE ATÉ UM PASSO. Quem manda no destino é o índice no array `passos`,
             que é a unidade real da cena: numa aula dividida existem dois passos, e o segundo é a
             ementa do "Together we'll explore". */
          const irParaPasso = (k: number) => {
            const st = tl.scrollTrigger;
            if (!st) return;
            const destino = Math.min(ultimoPasso, Math.max(0, k));
            const y = st.start + (st.end - st.start) * (destino / unidades);
            alvoPasso = destino;
            viagemAte = performance.now() + 1400;
            rolarPara(y);
          };

          /* os traços do pé levam direto ao COMEÇO de um capítulo, porque é isso que eles
             representam: a aula inteira, não a página dentro dela */
          const irPara = (c: number) => irParaPasso(Math.max(0, passos.findIndex((p) => p.cap === c)));
          const cliques = marcas.map((m, i) => {
            const fn = () => irPara(i);
            m.addEventListener("click", fn);
            return fn;
          });

          /* AS SETAS ANDAM UMA PÁGINA POR VEZ, não uma aula. Pedido da Bruna em 24/09: "quando
             clica nas setas não vai pra próxima página, vai direto pra próxima aula". Antes elas
             chamavam `irPara(capítulo ± 1)`, que cai sempre no primeiro tempo do capítulo
             seguinte, e por isso a ementa de nenhuma aula chegava a aparecer para quem navegava
             pelas setas. Medido a 390x844, antes do conserto: cinco aulas, cinco listas, zero
             itens acesos. */
          const irRelativo = (d: number) => irParaPasso(alvoPasso + d);
          const aoAnterior = () => irRelativo(-1);
          const aoProximo = () => irRelativo(1);
          setaAnterior?.addEventListener("click", aoAnterior);
          setaProxima?.addEventListener("click", aoProximo);

          return () => {
            marcas.forEach((m, i) => m.removeEventListener("click", cliques[i]));
            setaAnterior?.removeEventListener("click", aoAnterior);
            setaProxima?.removeEventListener("click", aoProximo);
          };
        },
      );

      return () => {
        observador.disconnect();
        cortes.forEach((c) => c?.revert());
        capitulos.forEach((c) => delete c.dataset.tempos);
        delete raiz.dataset.letra;
      };
    },
    { scope: secao, dependencies: [fontesProntas, versao], revertOnUpdate: true },
  );

  const total = String(itens.length + 1).padStart(2, "0");
  /* no celular a abertura não entra na conta: a primeira aula é a 01 */
  const totalCelular = String(itens.length).padStart(2, "0");

  return (
    <section id="classes" className="secao secao-aulas" aria-labelledby="classes-titulo" ref={secao}>
      <div className="palco" ref={palco}>
        <div className="container palco-grade">
          <div className="palco-topo">
            <h2 id="classes-titulo" className="palco-titulo">
              {titulo}
            </h2>

            {/* O ATALHO PERSISTENTE (Bruna, 2026-09-23): "'Plan your preparation' só aparece no
                início dessa parte. Seria legal ter uma opção durante todos os slides? Pequeno e
                discreto". Ele mora no TOPO do palco, que é a única parte que não troca de
                capítulo, então está à mão em todos eles sem repetir o botão grande da abertura.
                Coube aqui porque o título encurtou para "Classes", no outro pedido dela. */}
            <a href={ctaHref} className="link-linha palco-atalho">
              {cta}
            </a>

            {/* A camada das borboletas vive DENTRO do topo porque é ele a referência da faixa
                no celular. No desktop o topo volta a ser estático e a camada passa a se medir
                pelo palco inteiro, atravessando a cena pelas margens. */}
            {/* SOBROU UMA BORBOLETA, e é decisão da Bruna (2026-09-23): "podemos retirar a
                borboleta do lado esquerdo? gostei da borboleta do lado direito do texto". A que
                saiu era a `borboleta-fundo`, que no desktop pousava na margem esquerda (medido a
                1431px: centro a 5% da tela) e no celular voava atrás da outra. Removida do
                markup, e não escondida por CSS, para o arquivo dela também parar de ser baixado
                no celular. */}
            <div className="borboletas" aria-hidden="true">
              <span className="borboleta borboleta-frente">
                <span className="borboleta-asa">
                  <Image src="/fotos/borboleta-2.png" alt="" width={475} height={528} sizes="150px" />
                </span>
              </span>
            </div>
          </div>

          <div className="palco-cena">
            <article className="cap cap-intro">{capitulo0}</article>

            {itens.map((it) => (
              <article key={it.chave} className="cap cap-aula">
                <div className="cap-quadro">
                  <div className="arco cap-arco">
                    <div className="cap-foto">
                      <Image
                        src={it.foto.src}
                        alt={it.foto.alt}
                        fill
                        quality={90}
                        sizes="(min-width: 1024px) 430px, (min-width: 700px) 340px, 96vw"
                        style={it.foto.posicao ? { objectPosition: it.foto.posicao } : undefined}
                      />
                    </div>
                  </div>
                  {/* a linha da marca, desenhada ao entrar (o mesmo gesto da seção 3) */}
                  <svg className="cap-linha-svg" aria-hidden="true" preserveAspectRatio="none">
                    <path className="cap-linha" />
                  </svg>
                </div>

                <div className="cap-corpo">
                  <span className="cap-numero display" aria-hidden="true">
                    <span className="so-largo">{it.numero}</span>
                    <span className="so-estreito">{it.numeroCelular}</span>{" "}
                    <span className="cap-total">
                      /<span className="so-largo"> {total}</span>
                      <span className="so-estreito"> {totalCelular}</span>
                    </span>
                  </span>
                  <h3 className="cap-nome">
                    <Inteiras texto={it.nome} />
                    {it.preco ? <em className="enfase cap-preco">{it.preco}</em> : null}
                  </h3>
                  <p className="cap-intro-texto">{it.intro}</p>
                  <div className="cap-detalhe">{it.detalhe}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="palco-barra">
            <span className="palco-barra-trilha">
              <span className="palco-barra-ativa" />
            </span>
            <div className="palco-navega">
              <button type="button" className="seta" data-seta="anterior" aria-label={rotuloAnterior} disabled>
                <Seta para="anterior" />
              </button>

              <span className="palco-marcas" role="tablist" aria-label={rotuloMarcas}>
                {[capitulo0, ...itens].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === 0}
                    className="palco-marca"
                    aria-label={i === 0 ? rotuloAbertura : itens[i - 1].nome}
                  />
                ))}
              </span>

              <button type="button" className="seta" data-seta="proxima" aria-label={rotuloProximo}>
                <Seta para="proxima" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
