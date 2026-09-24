"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NS = "http://www.w3.org/2000/svg";

/* A ponta da linha anda na LINHA DE LEITURA: 62% da altura da tela, um pouco abaixo do meio,
   que é onde o olho está quando a pessoa lê rolando. */
const LEITURA = 0.62;

/* meia largura da faixa de cada trecho: cabe o balanço do traço e o nó, que abre para fora */
const FAIXA = 32;

type Ponto = { x: number; y: number };
type Peca = { pontos: Ponto[]; no: boolean };
type Fio = {
  path: SVGPathElement;
  total: number;
  /** a posição da linha de leitura (em y do trecho) em que a ponta chega a cada ponto */
  chaves: number[];
  /** o comprimento do traço até cada ponto */
  comprimentos: number[];
  ultimo: number;
};
type Trecho = { secao: HTMLElement; svg: SVGSVGElement; fios: Fio[]; topo: number };

/* O traço não é régua: um balanço lento e irregular, de poucos pixels, na escala da página
   inteira. É o que faz a linha ler como desenhada à mão, e é função do Y DA PÁGINA, então dois
   trechos vizinhos se encontram na emenda exatamente no mesmo ponto. */
function balanco(yPagina: number, amp: number) {
  return (
    amp *
    (0.62 * Math.sin((yPagina / 1310) * Math.PI * 2 + 0.7) +
      0.38 * Math.sin((yPagina / 2870) * Math.PI * 2 + 2.1))
  );
}

function reta(y0: number, y1: number, xEm: (y: number) => number): Ponto[] {
  const n = Math.max(1, Math.ceil((y1 - y0) / 8));
  const pontos: Ponto[] = [];
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    pontos.push({ x: xEm(y), y });
  }
  return pontos;
}

/* O NÓ. A linha que desce dá uma volta para FORA (para a borda da tela, longe do texto) e volta a
   descer um pouco abaixo de onde entrou, cruzando o próprio traço: o gesto de quem desenha sem
   tirar a caneta do papel. Um em cada emenda, e é isso que costura uma seção na outra.
   A volta é mais alta que larga, como a laçada de uma letra cursiva. MEDIDO: redonda, ela lia
   como uma argola pendurada no fio, geométrica demais para a mão que desenhou a logo. */
function no(x: number, yc: number, rx: number, ry: number, delta: number): Ponto[] {
  const pontos: Ponto[] = [];
  const passos = 44;
  for (let i = 0; i <= passos; i++) {
    const t = (i / passos) * Math.PI * 2;
    pontos.push({
      x: x - rx * (1 - Math.cos(t)),
      y: yc + ry * Math.sin(t) + (delta * t) / (Math.PI * 2),
    });
  }
  return pontos;
}

/* A TABELA DA CANETA. Para cada ponto do traço, em que altura da linha de leitura a ponta chega
   nele. Nas retas a ponta acompanha a leitura; o nó não sobe e desce junto com a página (ele dá
   uma volta), então ganha um trecho fixo de rolagem e as retas do mesmo trecho cedem esse tanto,
   para o fim do trecho continuar caindo exatamente na emenda. */
function tabela(pecas: Peca[], H: number, vaoDoNo: number) {
  const nos = pecas.filter((p) => p.no).length;
  const dyRetas = pecas
    .filter((p) => !p.no)
    .reduce((s, p) => s + (p.pontos[p.pontos.length - 1].y - p.pontos[0].y), 0);
  const fator = dyRetas > 0 ? Math.max(0, H - nos * vaoDoNo) / dyRetas : 0;

  const pontos: Ponto[] = [];
  const chaves: number[] = [];
  const comprimentos: number[] = [];
  let k = 0;
  let L = 0;
  for (const p of pecas) {
    const locais = [0];
    for (let i = 1; i < p.pontos.length; i++) {
      const a = p.pontos[i - 1];
      const b = p.pontos[i];
      locais.push(locais[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    const Lp = locais[locais.length - 1];
    const y0 = p.pontos[0].y;
    const dy = p.pontos[p.pontos.length - 1].y - y0;
    const vao = p.no ? vaoDoNo : dy * fator;
    for (let i = 0; i < p.pontos.length; i++) {
      /* o primeiro ponto de cada peça é o último da anterior */
      if (i === 0 && pontos.length) continue;
      const fracao = p.no ? (Lp ? locais[i] / Lp : 0) : dy ? (p.pontos[i].y - y0) / dy : 0;
      pontos.push(p.pontos[i]);
      chaves.push(k + vao * fracao);
      comprimentos.push(L + locais[i]);
    }
    k += vao;
    L += Lp;
  }
  return { pontos, chaves, comprimentos, total: L };
}

function caminho(pontos: Ponto[], dx: number) {
  return pontos
    .map((p, i) => `${i ? "L" : "M"}${(p.x - dx).toFixed(2)} ${p.y.toFixed(2)}`)
    .join("");
}

function comprimentoEm(f: Fio, p: number) {
  const k = f.chaves;
  const n = k.length - 1;
  if (n < 1 || p <= k[0]) return 0;
  if (p >= k[n]) return f.total;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const meio = (lo + hi) >> 1;
    if (k[meio] <= p) lo = meio;
    else hi = meio;
  }
  const t = (p - k[lo]) / (k[hi] - k[lo] || 1);
  return f.comprimentos[lo] + (f.comprimentos[hi] - f.comprimentos[lo]) * t;
}

/* o raio da borda do campo, resolvido em pixels (o navegador devolve % como %) */
function raio(valor: string, base: number) {
  const v = valor.trim();
  return v.endsWith("%") ? (parseFloat(v) / 100) * base : parseFloat(v) || 0;
}

/**
 * A ESPINHA: a linha contínua que atravessa o site (movimento.md, verbo 1; design.md, seção 5,
 * item 1). Passe 3, 2026-09-11.
 *
 * "Não existe divisória. Uma única linha de tinta desce pelo site, ligada ao progresso da rolagem,
 * e atravessa a emenda entre uma seção e a próxima." Até aqui só três das onze emendas tinham algo
 * que as atravessasse (os campos que sobem); as outras oito eram corte seco entre blocos.
 *
 * COMO É FEITA, e por que assim:
 * - UM SVG POR TRECHO, dentro de cada seção, e não um caminho gigante de página inteira: cada
 *   trecho vai do topo ao pé da própria seção, na mesma coordenada x, então a emenda é exata e
 *   nenhuma seção precisa transbordar sobre a vizinha (hero, pacotes e a mesa cortam o que passa
 *   da borda). A posse da emenda é da seção de cima: é nela que mora o nó.
 * - O traço corre no MEIO DA MARGEM do container, fora da coluna de texto, nos dois aparelhos.
 * - A ponta anda na linha de leitura da tela, com a mesma suavidade dos scrubs do site. Nas cenas
 *   presas (3, 4 e 6) a linha mora na seção, não na cena: a cena para, a linha continua. É a
 *   câmera que não para.
 * - Em cada emenda, um NÓ: o gesto que costura uma seção na outra.
 * - O FIM: no rodapé a linha pousa na borda do arco e desenha o arco inteiro, a curva da logo, de
 *   um lado ao outro da tela. É o abraço ("uma linha contínua que segura sem apertar"), e é nele
 *   que a terracota assenta, embaixo de "You do not have to figure out postpartum alone."
 *
 * Os SVGs são criados aqui, fora da árvore de cada seção, porque a câmera nunca se escreve dentro
 * de uma seção fechada (e duas das seções são do catálogo). Decorativos: aria-hidden.
 * Reduced-motion: a linha inteira desenhada, parada.
 */
export function Espinha() {
  useGSAP(() => {
    const secoes = Array.from(document.querySelectorAll<HTMLElement>("main > section:not(.hero)"));
    const rodape = document.querySelector<HTMLElement>("footer.rodape");
    if (!secoes.length) return;
    const alvos = rodape ? [...secoes, rodape] : secoes;
    const html = document.documentElement;

    /* ---- QUANDO UMA SEÇÃO MUDA DE ALTURA SEM AVISAR ----
       Uma pergunta do FAQ que abre, um texto que cresce: tudo abaixo dela desce, e os gatilhos
       continuam com as posições velhas (o campo do rodapé subiria na hora errada, e a linha
       também). Aqui a mudança é vista e o ScrollTrigger remede. A foto das alturas é tirada a cada
       remedida, então a mudança que a PRÓPRIA remedida causa (os espaçadores das cenas presas) não
       dispara outra. Mudança de altura da janela é ignorada: no celular é a barra de endereço, e
       remedir a cada rolagem era a segunda fonte do embaralhamento (ver MovimentoProvider). */
    let alturas = alvos.map((s) => s.offsetHeight);
    let vistaL = html.clientWidth;
    let vistaA = window.innerHeight;
    const fotografar = () => {
      alturas = alvos.map((s) => s.offsetHeight);
      vistaL = html.clientWidth;
      vistaA = window.innerHeight;
    };
    let espera = 0;
    const vigia = new ResizeObserver(() => {
      if (html.clientWidth !== vistaL || window.innerHeight !== vistaA) return;
      const mudou = alvos.some((s, i) => Math.abs(s.offsetHeight - alturas[i]) > 1);
      if (!mudou) return;
      window.clearTimeout(espera);
      espera = window.setTimeout(() => ScrollTrigger.refresh(), 220);
    });
    alvos.forEach((s) => vigia.observe(s));
    ScrollTrigger.addEventListener("refresh", fotografar);

    const mm = gsap.matchMedia();
    mm.add(
      {
        anima: "(prefers-reduced-motion: no-preference)",
        reduzido: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { anima } = ctx.conditions as { anima: boolean };

        const criar = (secao: HTMLElement, fios: number): Trecho => {
          const svg = document.createElementNS(NS, "svg");
          svg.setAttribute("class", "espinha");
          svg.setAttribute("aria-hidden", "true");
          svg.setAttribute("focusable", "false");
          const lista: Fio[] = [];
          for (let i = 0; i < fios; i++) {
            const path = document.createElementNS(NS, "path");
            path.setAttribute("class", "espinha-fio");
            path.style.visibility = "hidden";
            svg.appendChild(path);
            lista.push({ path, total: 0, chaves: [], comprimentos: [], ultimo: -1 });
          }
          secao.appendChild(svg);
          return { secao, svg, fios: lista, topo: 0 };
        };
        const trechos = secoes.map((s) => criar(s, 1));
        if (rodape) trechos.push(criar(rodape, 3));

        let caneta = NaN;

        const aplicar = (f: Fio, l: number, forcar: boolean) => {
          const q = l <= 0.4 ? 0 : l >= f.total - 0.4 ? f.total : Math.round(l * 2) / 2;
          if (!forcar && q === f.ultimo) return;
          f.ultimo = q;
          const st = f.path.style;
          /* traço de comprimento zero com ponta redonda vira um ponto: some em vez disso */
          if (q === 0) {
            st.visibility = "hidden";
            return;
          }
          st.visibility = "";
          st.strokeDasharray = q >= f.total ? "" : `${q} ${Math.ceil(f.total + 8)}`;
        };

        const desenhar = (forcar = false) => {
          for (const t of trechos) {
            for (const f of t.fios) {
              if (!f.total) continue;
              aplicar(f, anima && !Number.isNaN(caneta) ? comprimentoEm(f, caneta - t.topo) : anima ? 0 : f.total, forcar);
            }
          }
        };

        const medir = () => {
          /* primeiro TODAS as leituras, depois todas as escritas: intercalar as duas faria o
             navegador recalcular o layout a cada trecho */
          const vw = html.clientWidth;
          const ref = document.querySelector<HTMLElement>(".container");
          const cs = ref ? getComputedStyle(ref) : null;
          const maxW = cs ? parseFloat(cs.maxWidth) : NaN;
          const gutter = (cs && parseFloat(cs.paddingLeft)) || 20;
          const larguraContainer = Number.isFinite(maxW) ? Math.min(vw, maxW) : vw;
          const x0 = Math.max(6, (vw - larguraContainer) / 2 + gutter / 2);
          const sy = window.scrollY;
          const medidas = trechos.map((t) => ({
            topo: t.secao.getBoundingClientRect().top + sy,
            H: t.secao.offsetHeight,
          }));
          const campo = rodape?.querySelector<HTMLElement>(".campo-tinta") ?? null;
          const campoCs = campo ? getComputedStyle(campo) : null;
          const campoW = campo?.offsetWidth ?? 0;
          const campoH = campo?.offsetHeight ?? 0;
          const vh = html.clientHeight;

          const celular = vw < 768;
          const amp = celular ? 1.6 : 4;
          const rx = celular ? 3.6 : 6;
          const ry = celular ? 6.5 : 11;
          const delta = celular ? 5 : 8;
          const vaoDoNo = celular ? 52 : 72;

          trechos.forEach((t, i) => {
            const { topo, H } = medidas[i];
            t.topo = topo;

            /* ---- O ABRAÇO, no rodapé ---- */
            if (t.secao === rodape) {
              if (!campo || !campoCs || !campoW) return;
              const partes = campoCs.borderTopLeftRadius.split(" ");
              const rx = raio(partes[0], campoW);
              const ry = raio(partes[1] ?? partes[0], campoH);
              if (!rx || !ry) return;
              const cx = campoW / 2;
              const xJ = Math.min(campoW - 1, x0 + balanco(topo, amp));
              const u = Math.max(-1, Math.min(1, (xJ - cx) / rx));
              const yJ = ry - ry * Math.sqrt(Math.max(0, 1 - u * u));
              const phi0 = Math.acos(u);
              /* a linha pousa na borda do arco e o arco se desenha para os dois lados, no mesmo
                 tempo de rolagem: quase um terço de tela depois do pouso */
              const vao = vh * 0.3;
              const ramo = (ate: number) => {
                const passos = Math.max(8, Math.ceil(Math.abs(ate - phi0) / 0.008));
                const pts: Ponto[] = [];
                for (let s = 0; s <= passos; s++) {
                  const phi = phi0 + ((ate - phi0) * s) / passos;
                  pts.push({ x: cx + rx * Math.cos(phi), y: ry - ry * Math.sin(phi) });
                }
                return pts;
              };
              const descida = reta(0, yJ, () => xJ);
              const direita = ramo(0);
              const esquerda = ramo(Math.PI);
              const tabDescida = tabela([{ pontos: descida, no: false }], yJ, 0);
              const linear = (pts: Ponto[]) => {
                const comp = [0];
                for (let s = 1; s < pts.length; s++) {
                  comp.push(comp[s - 1] + Math.hypot(pts[s].x - pts[s - 1].x, pts[s].y - pts[s - 1].y));
                }
                const tot = comp[comp.length - 1] || 1;
                return { chaves: comp.map((c) => yJ + (vao * c) / tot), comprimentos: comp, total: comp[comp.length - 1] };
              };
              const alturaSvg = Math.ceil(Math.max(yJ, ry) + 8);
              t.svg.setAttribute("width", String(campoW));
              t.svg.setAttribute("height", String(alturaSvg));
              t.svg.setAttribute("viewBox", `0 0 ${campoW} ${alturaSvg}`);
              t.svg.style.left = "0px";
              const conjuntos = [
                { pts: descida, tab: tabDescida },
                { pts: direita, tab: linear(direita) },
                { pts: esquerda, tab: linear(esquerda) },
              ];
              conjuntos.forEach(({ pts, tab }, j) => {
                const f = t.fios[j];
                f.path.setAttribute("d", caminho(pts, 0));
                f.total = tab.total;
                f.chaves = tab.chaves;
                f.comprimentos = tab.comprimentos;
                f.ultimo = -1;
              });
              return;
            }

            /* ---- O traço da margem, com o nó na emenda ---- */
            const primeiro = i === 0;
            /* a última seção antes do rodapé não dá nó: a emenda dela é o abraço */
            const antesDoRodape = i === secoes.length - 1;
            const xEm = (y: number) => x0 + balanco(topo + y, amp);
            const pecas: Peca[] = [];
            let y = 0;
            if (primeiro) {
              /* o primeiro nó, logo abaixo da hero: o nó que se dá na ponta da linha antes de
                 começar a costurar */
              const yc = ry + 10;
              pecas.push({ pontos: reta(0, yc, xEm), no: false });
              pecas.push({ pontos: no(xEm(yc), yc, rx, ry, delta), no: true });
              y = yc + delta;
            }
            if (!antesDoRodape) {
              const yc = H - (ry + delta + 16);
              pecas.push({ pontos: reta(y, yc, xEm), no: false });
              pecas.push({ pontos: no(xEm(yc), yc, rx, ry, delta), no: true });
              y = yc + delta;
            }
            pecas.push({ pontos: reta(y, H, xEm), no: false });
            const tab = tabela(pecas, H, vaoDoNo);
            const esquerdaSvg = x0 - FAIXA;
            t.svg.setAttribute("width", String(FAIXA * 2));
            t.svg.setAttribute("height", String(Math.ceil(H)));
            t.svg.setAttribute("viewBox", `0 0 ${FAIXA * 2} ${Math.ceil(H)}`);
            t.svg.style.left = `${esquerdaSvg.toFixed(2)}px`;
            const f = t.fios[0];
            f.path.setAttribute("d", caminho(tab.pontos, esquerdaSvg));
            f.total = tab.total;
            f.chaves = tab.chaves;
            f.comprimentos = tab.comprimentos;
            f.ultimo = -1;
          });

          desenhar(true);
        };

        /* uma medida por quadro, no máximo */
        let pedido = 0;
        const agendar = () => {
          if (pedido) return;
          pedido = requestAnimationFrame(() => {
            pedido = 0;
            medir();
          });
        };
        const tamanho = new ResizeObserver(agendar);
        alvos.forEach((s) => tamanho.observe(s));
        ScrollTrigger.addEventListener("refresh", medir);
        medir();

        /* A CANETA. Segue a linha de leitura com a mesma suavidade dos scrubs do site (a Lenis já
           suaviza a rolagem; aqui é só o assentar da ponta). */
        const quadro = (_tempo: number, dt: number) => {
          const alvo = window.scrollY + html.clientHeight * LEITURA;
          if (Number.isNaN(caneta)) caneta = alvo;
          else {
            caneta += (alvo - caneta) * (1 - Math.exp(-Math.min(dt, 64) / 90));
            if (Math.abs(alvo - caneta) < 0.25) caneta = alvo;
          }
          desenhar();
        };
        if (anima) gsap.ticker.add(quadro);

        return () => {
          gsap.ticker.remove(quadro);
          ScrollTrigger.removeEventListener("refresh", medir);
          tamanho.disconnect();
          cancelAnimationFrame(pedido);
          trechos.forEach((t) => t.svg.remove());
        };
      },
    );

    return () => {
      window.clearTimeout(espera);
      vigia.disconnect();
      ScrollTrigger.removeEventListener("refresh", fotografar);
    };
  });

  return null;
}
