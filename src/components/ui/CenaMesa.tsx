"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { FiguraAndando } from "./FiguraAndando";
import { Seta } from "./Seta";
import { Inteiras } from "../Enfase";
import { rolarPara } from "../MovimentoProvider";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export type Prova = {
  chave: string;
  /** as medidas REAIS do arquivo. É delas que sai a proporção da prova, e é isso que impede o corte. */
  foto: { src: string; alt: string; w: number; h: number };
};

export type Tempo = {
  chave: string;
  prova: number;
  rotulo: string;
  titulo: ReactNode;
  corpo: ReactNode;
  folha?: { rotulo: string; titulo: string; conteudo: ReactNode };
};

/**
 * Seção 6, os cuidados complementares: "A MESA" (autoral, GSAP; 2026-09-11, quarta versão).
 *
 * O QUE MATOU AS TRÊS VERSÕES ANTERIORES, e é sempre o mesmo erro meu: eu escolhia a composição
 * primeiro e encaixava as fotos depois. Os arquivos desta seção são:
 *   carimbo-placenta      912 x 1488   retrato   0,61
 *   capsulas-placenta    1024 x  682   paisagem  1,50
 *   closing-of-the-bones 1024 x  682   paisagem  1,50
 * Uma moldura fixa ESMAGA pelo menos uma delas. Na versão 3 a moldura era uma fresta de 1150 por
 * 396 e o object-fit cover jogou fora dois terços de cada foto: na cerimônia sobrou um pano
 * amarelo e a mulher sumiu. O Gabriel viu isso na hora, e estava certo.
 *
 * A DECISÃO QUE RESOLVE: cada foto vira uma PROVA, uma cópia revelada, e cada prova tem a
 * proporção do próprio arquivo. Nada é cortado, nunca, em tela nenhuma. A mesa é que se adapta.
 * A restrição virou o conceito: um ateliê onde as provas são postas sobre o papel, uma a uma.
 *
 * O MOVIMENTO: as provas são DEPOSITADAS na mesa conforme a pessoa rola. A que entra vem da
 * direita, inclinada, e assenta; a anterior recua, gira para o outro lado e fica por baixo. No
 * fim as três estão em leque sobre a mesa, que é o que a seção é: uma coleção de lembranças.
 * Só transform: x, y, rotação, escala. Nada de largura animada, nada de recorte.
 *
 * O QUE VEIO DO 21ST.DEV, adaptado e não copiado: "Stacking Cards" (danielpetho, 25275), a pilha
 * dirigida pela rolagem com pin, de onde vem o MOTOR; e "Stacked Card Carousel" (shadcnspace,
 * 21516), o leque com rotação e profundidade, de onde vem o VISUAL do repouso. Nenhum dos dois
 * respeitava a proporção de cada imagem, e é essa a adaptação que a marca exigia.
 *
 * A PEÇA VIVA: a prova de cima respira, uma deriva mínima e lenta, para a mesa nunca ficar morta.
 * E a mulher que anda na seção 3 anda também na aba da folha, que é o que a transforma de truque
 * de uma seção em assinatura do site.
 *
 * Reduced-motion ou tela baixa: sem pin, as provas viram uma coluna e todos os tempos aparecem.
 * Posse do movimento: GSAP.
 */
export function CenaMesa({
  tituloId,
  titulo,
  provas,
  tempos,
  cta,
  ctaHref,
  fechar,
  rotuloAnterior,
  rotuloProximo,
}: {
  tituloId: string;
  titulo: string;
  provas: Prova[];
  tempos: Tempo[];
  cta: string;
  ctaHref: string;
  fechar: string;
  /** as duas setas de tempo. Ver a nota em `Seta.tsx`: pedido da cliente, em áudio. */
  rotuloAnterior: string;
  rotuloProximo: string;
}) {
  const secao = useRef<HTMLElement | null>(null);
  const palco = useRef<HTMLDivElement | null>(null);
  const folha = useRef<HTMLDialogElement | null>(null);
  const [aberta, setAberta] = useState<number | null>(null);

  const abrir = (i: number) => {
    setAberta(i);
    folha.current?.showModal();
    window.dispatchEvent(new CustomEvent("cora:travar-rolagem", { detail: true }));
  };

  useGSAP(
    () => {
      const raiz = secao.current;
      const stage = palco.current;
      if (!raiz || !stage) return;

      const n = tempos.length;
      /* o alvo da navegação, separado do tempo que está na tela: ver a nota igual em CenaAulas */
      let alvoTempo = 0;
      let viagemAte = 0;
      const provasEls = gsap.utils.toArray<HTMLElement>(".mesa-prova", raiz);
      const temposEls = gsap.utils.toArray<HTMLElement>(".mesa-tempo", raiz);
      const marcas = gsap.utils.toArray<HTMLElement>(".mesa-marca", raiz);
      const setaAnterior = raiz.querySelector<HTMLButtonElement>('[data-seta="anterior"]');
      const setaProxima = raiz.querySelector<HTMLButtonElement>('[data-seta="proxima"]');

      const cortes = temposEls.map((el) => {
        const alvo = el.querySelector<HTMLElement>(".mesa-titulo");
        return alvo
          ? /* reduceWhiteSpace: false guarda o espaço inflexível das últimas palavras */
            new SplitText(alvo, { type: "lines", linesClass: "mesa-linha", mask: "lines", reduceWhiteSpace: false })
          : null;
      });
      const linhasDe = (i: number) => cortes[i]?.lines ?? [];
      const corpoDe = (i: number) => gsap.utils.toArray<HTMLElement>(".mesa-corpo > *", temposEls[i]);

      /* COMO CADA PROVA REPOUSA: em cima, recuada por baixo, ou ainda por chegar.
         Tudo em PIXELS, e a centragem e do CSS (grid place-items center), nunca do transform.
         Motivo, e custou uma versao inteira para descobrir: com invalidateOnRefresh o GSAP
         rele o transform COMPUTADO do elemento, e o navegador devolve translate ja resolvido em
         pixels. O GSAP entao guarda aquilo em x/y e zera xPercent/yPercent. Na animacao seguinte
         ele escrevia translate(-50%,-50%) E translate(-33px,-94px) ao mesmo tempo, e a prova
         subia por cima da headline. Com base zero e deslocamento em pixel isso nao acontece. */
      const largura = (k: number) => provasEls[k]?.offsetWidth || 0;
      const altura = (k: number) => provasEls[k]?.offsetHeight || 0;
      const EM_CIMA = (k: number) => ({
        x: 0,
        y: 0,
        rotation: [-2.2, 1.8, -1.4][k % 3],
        scale: 1,
        opacity: 1,
      });
      /* AS PROVAS ANTIGAS RECUAM MAIS a partir de 2026-09-23. Com opacidade 0,6 elas continuavam
         disputando a atenção, e a Bruna leu o resultado assim: "a foto do closing of the bones
         está junto com as fotos de placenta". Elas JÁ estão do lado esquerdo do texto, que era o
         que ela pediu; o que faltava era a de cima ser claramente A foto daquele texto. Recuando
         mais, o leque continua existindo (a seção é uma coleção de lembranças) sem competir. */
      const RECUADA = (k: number) => ({
        x: () => largura(k) * [-0.07, -0.04, -0.06][k % 3],
        y: () => altura(k) * [0.03, 0.05, 0.02][k % 3],
        rotation: [-8.5, -6, -9.5][k % 3],
        scale: 0.86,
        opacity: 0.32,
      });
      const POR_CHEGAR = (k: number) => ({
        x: () => largura(k) * 0.42,
        y: () => altura(k) * 0.08,
        rotation: 11,
        scale: 0.93,
        opacity: 0,
      });

      /* O TAMANHO DE CADA PROVA, EM PIXELS.
         Tentar isto em CSS puro nao funciona: um elemento absoluto com aspect-ratio e
         block-size 100% colapsa para zero, e com height 100% mais max-width o navegador viola
         a proporcao para caber. Entao o tamanho e CALCULADO: cada prova recebe a maior medida
         que cabe na mesa MANTENDO a proporcao do arquivo. E a unica forma de garantir que
         nenhuma foto seja cortada nem esticada, em tela nenhuma. */
      const area = raiz.querySelector<HTMLElement>(".mesa-area");
      const medir = () => {
        if (!area) return;
        const W = area.clientWidth;
        const H = area.clientHeight;
        if (!W || !H) return;
        const primeiroPapel = provasEls[0].querySelector<HTMLElement>(".mesa-papel");
        const pad = primeiroPapel ? parseFloat(getComputedStyle(primeiroPapel).paddingTop) || 0 : 0;
        provasEls.forEach((p) => {
          const w = Number(p.dataset.w) || 1;
          const h = Number(p.dataset.h) || 1;
          const caixa = p.querySelector<HTMLElement>(".mesa-prova-foto");
          if (!caixa) return;
          /* a folga de 6% e o ar da mesa: sem ela a prova encosta na borda e, como ela esta
             inclinada, a quina passa por cima da coluna do texto */
          const esc = Math.min(((W - pad * 2) * 0.94) / w, ((H - pad * 2) * 0.95) / h);
          caixa.style.width = Math.round(w * esc) + "px";
          caixa.style.height = Math.round(h * esc) + "px";
        });
      };
      medir();
      const aoRedimensionar = () => medir();
      window.addEventListener("resize", aoRedimensionar);

      const acender = (i: number) => {
        marcas.forEach((m, j) => m.classList.toggle("esta-ativa", j === i));
        temposEls.forEach((t, j) => t.setAttribute("aria-hidden", j === i ? "false" : "true"));
        raiz.dataset.tempo = String(i);
        if (performance.now() > viagemAte) alvoTempo = i;
        if (setaAnterior) setaAnterior.disabled = i <= 0;
        if (setaProxima) setaProxima.disabled = i >= n - 1;
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          /* AS DUAS CONDICOES PRECISAM COBRIR TODOS OS CASOS. O gsap.matchMedia so executa o
             callback quando ALGUMA condicao casa; se sobrar uma brecha, a cena simplesmente nao
             e montada. Foi o que aconteceu quando "presa" ganhou o min-height: numa tela de
             568px sem preferencia por menos movimento nenhuma das duas casava, o callback nao
             rodava, e a secao ficava sem layout nenhum. A virgula aqui e OU.
             640px de altura e o piso MEDIDO, nao chutado: a 568px a mesa ficava com 53px e a
             foto virava uma fresta. Tela que nao comporta a cena recebe o fluxo normal, mais
             longo porem legivel, em vez da cena espremida. */
          presa: "(prefers-reduced-motion: no-preference) and (min-height: 640px)",
          aberta: "(prefers-reduced-motion: reduce), (max-height: 639px)",
        },
        (ctx) => {
          const { presa } = ctx.conditions as { presa: boolean };

          if (!presa) {
            raiz.dataset.modo = "aberto";
            gsap.set(provasEls, { clearProps: "all" });
            /* sem pin as provas viram coluna, entao a medida vem da LARGURA disponivel e nao da
               altura da mesa. Sem isto a caixa da foto ficava com width auto e colapsava. */
            const medirEmColuna = () => {
              provasEls.forEach((p) => {
                const w = Number(p.dataset.w) || 1;
                const h = Number(p.dataset.h) || 1;
                const papel = p.querySelector<HTMLElement>(".mesa-papel");
                const caixa = p.querySelector<HTMLElement>(".mesa-prova-foto");
                if (!papel || !caixa) return;
                const pad = parseFloat(getComputedStyle(papel).paddingLeft) || 0;
                const larg = Math.max(0, papel.clientWidth - pad * 2);
                if (!larg) return;
                caixa.style.width = Math.round(larg) + "px";
                caixa.style.height = Math.round((larg * h) / w) + "px";
              });
            };
            medirEmColuna();
            requestAnimationFrame(medirEmColuna);
            window.addEventListener("resize", medirEmColuna);
            gsap.set(temposEls, { opacity: 1, y: 0 });
            cortes.forEach((c) => c && gsap.set(c.lines, { yPercent: 0, opacity: 1 }));
            gsap.set(".mesa-corpo > *", { opacity: 1, y: 0 });
            marcas.forEach((m) => m.classList.remove("esta-ativa"));
            return () => window.removeEventListener("resize", medirEmColuna);
          }

          raiz.dataset.modo = "mesa";

          const primeira = tempos[0].prova;
          provasEls.forEach((p, k) => {
            gsap.set(p, k === primeira ? { ...EM_CIMA(k), zIndex: 10 } : { ...POR_CHEGAR(k), zIndex: 1 });
          });

          temposEls.forEach((t, i) => {
            gsap.set(t, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
            const ln = linhasDe(i);
            if (ln.length) gsap.set(ln, { yPercent: i === 0 ? 0 : 106, opacity: i === 0 ? 1 : 0 });
            const cp = corpoDe(i);
            if (cp.length) gsap.set(cp, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 14 });
          });
          acender(0);

          /* A RESPIRAÇÃO DA MESA. Amplitude minúscula de propósito: o objetivo é a mesa não
             parecer congelada, não chamar atenção. */
          const respiros = provasEls.map((p, k) => {
            const papel = p.querySelector<HTMLElement>(".mesa-papel");
            return gsap.to(papel, {
              y: 3,
              rotation: 0.45,
              duration: 5.5 + k * 0.7,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            });
          });
          const respirar = (k: number) => respiros.forEach((r, j) => (j === k ? r.play() : r.pause()));
          respirar(primeira);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              /* O RITMO AFROUXOU em 2026-09-23, de 0,78 para 1,0 tela por tempo. A Bruna, lendo
                 no celular com uma mão, relatou que "os pacotes de placenta ficam mudando para
                 closing of the bones": o tempo dos pacotes é o que tem mais conteúdo (três faixas
                 de preço e a nota) e recebia a mesma fatia de rolagem dos outros, então ele
                 trocava antes de ela terminar de ler. Uma tela inteira por tempo dá o tempo da
                 leitura sem transformar a seção num túnel. */
              end: () => "+=" + window.innerHeight * 1.0 * (n - 1),
              pin: stage,
              pinSpacing: true,
              anticipatePin: 1,
              /* esta é a seção 6: mede depois da 3 (prioridade 2) e da 4 (prioridade 1) */
              refreshPriority: 0,
              scrub: 0.55,
              invalidateOnRefresh: true,
              onRefresh: medir,
              onUpdate: (self) => {
                const i = Math.round(self.progress * (n - 1));
                acender(i);
                respirar(tempos[i].prova);
              },
            },
          });

          for (let i = 1; i < n; i++) {
            const t = i - 1;
            const de = tempos[i - 1].prova;
            const para = tempos[i].prova;

            /* sai o tempo anterior. A saída e a entrada se cruzam de propósito: sem sobreposição
               existe um instante com a copy inteira invisível, e quem rola devagar cai nele. */
            const saiNome = linhasDe(i - 1);
            if (saiNome.length) tl.to(saiNome, { yPercent: -106, opacity: 0, duration: 0.24 }, t + 0.02);
            const saiCorpo = corpoDe(i - 1);
            if (saiCorpo.length) tl.to(saiCorpo, { opacity: 0, y: -12, duration: 0.22 }, t + 0.02);
            tl.to(temposEls[i - 1], { opacity: 0, duration: 0.24 }, t + 0.1);

            /* A PROVA É DEPOSITADA: a anterior recua e vai para baixo, a nova assenta por cima */
            if (de !== para) {
              tl.set(provasEls[de], { zIndex: 5 }, t + 0.06);
              tl.to(
                provasEls[de],
                { ...RECUADA(de), duration: 0.55, ease: "power2.inOut" },
                t + 0.06,
              );
              tl.set(provasEls[para], { zIndex: 10 }, t + 0.12);
              tl.fromTo(
                provasEls[para],
                POR_CHEGAR(para),
                { ...EM_CIMA(para), duration: 0.62, ease: "power3.out" },
                t + 0.12,
              );
            }

            /* entra o tempo novo */
            tl.to(temposEls[i], { opacity: 1, y: 0, duration: 0.26 }, t + 0.3);
            const entraNome = linhasDe(i);
            if (entraNome.length) {
              tl.fromTo(
                entraNome,
                { yPercent: 106, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.07 },
                t + 0.34,
              );
            }
            const entraCorpo = corpoDe(i);
            if (entraCorpo.length) {
              tl.fromTo(
                entraCorpo,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.28, stagger: 0.06 },
                t + 0.42,
              );
            }
          }

          const irPara = (i: number) => {
            const st = tl.scrollTrigger;
            if (!st) return;
            alvoTempo = i;
            viagemAte = performance.now() + 1400;
            rolarPara(st.start + (st.end - st.start) * (i / (n - 1)));
          };
          const cliques = marcas.map((m, i) => {
            const fn = () => irPara(i);
            m.addEventListener("click", fn);
            return fn;
          });

          /* AS SETAS, o mesmo atalho da seção 4: avançam um tempo, para quem não quer rolar. */
          const irRelativo = (d: number) => irPara(Math.min(n - 1, Math.max(0, alvoTempo + d)));
          const aoAnterior = () => irRelativo(-1);
          const aoProximo = () => irRelativo(1);
          setaAnterior?.addEventListener("click", aoAnterior);
          setaProxima?.addEventListener("click", aoProximo);

          return () => {
            respiros.forEach((r) => r.kill());
            marcas.forEach((m, i) => m.removeEventListener("click", cliques[i]));
            setaAnterior?.removeEventListener("click", aoAnterior);
            setaProxima?.removeEventListener("click", aoProximo);
          };
        },
      );

      return () => {
        window.removeEventListener("resize", aoRedimensionar);
        cortes.forEach((c) => c?.revert());
      };
    },
    { scope: secao, dependencies: [tempos.length, provas.length] },
  );

  const folhaAtual = aberta !== null ? tempos[aberta]?.folha : undefined;

  return (
    <section className="secao secao-mesa" id="additional" aria-labelledby={tituloId} ref={secao}>
      <div className="mesa-palco" ref={palco}>
        <div className="container mesa-quadro">
          <header className="mesa-cabeca">
            <h2 id={tituloId}>
              <Inteiras texto={titulo} />
            </h2>
          </header>

          <div className="mesa-cena">
            {/* A MESA. Cada prova guarda a proporção do próprio arquivo, então nenhuma é cortada. */}
            <div className="mesa-tampo" data-camada="meio">
              <div className="mesa-area">
                {provas.map((p) => (
                  <figure
                    className="mesa-prova"
                    key={p.chave}
                    data-w={p.foto.w}
                    data-h={p.foto.h}
                  >
                    {/* tres camadas, e cada uma tem UM dono de transform:
                        .mesa-prova  -> a linha do tempo da rolagem (onde a prova repousa)
                        .mesa-papel  -> a respiracao (a deriva minima e continua)
                        .mesa-prova-foto -> ninguem, so a medida em pixels
                        Sem essa separacao as duas animacoes escreviam a MESMA propriedade do
                        MESMO elemento, a ultima escrita ganhava, e a prova saia do lugar: no
                        celular ela subia por cima da headline. */}
                    <div className="mesa-papel">
                      <div className="mesa-prova-foto">
                        <Image
                          src={p.foto.src}
                          alt={p.foto.alt}
                          fill
                          quality={90}
                          sizes="(min-width: 900px) 42vw, 78vw"
                        />
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
            </div>

            <div className="mesa-copia">
              {tempos.map((tp, i) => (
                <article
                  className="mesa-tempo"
                  key={tp.chave}
                  aria-hidden={i === 0 ? "false" : "true"}
                >
                  <h3 className="mesa-titulo">
                    {typeof tp.titulo === "string" ? <Inteiras texto={tp.titulo} /> : tp.titulo}
                  </h3>
                  <div className="mesa-corpo">
                    {tp.corpo}
                    {tp.folha ? (
                      <button type="button" className="mesa-abrir" onClick={() => abrir(i)}>
                        <span>{tp.folha.rotulo}</span>
                        <span className="acordeao-indicador" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mesa-pe">
            <div className="mesa-navega">
              <button type="button" className="seta" data-seta="anterior" aria-label={rotuloAnterior} disabled>
                <Seta para="anterior" />
              </button>
              <span className="mesa-marcas">
                {tempos.map((tp) => (
                  <button key={tp.chave} type="button" className="mesa-marca" aria-label={tp.rotulo} />
                ))}
              </span>
              <button type="button" className="seta" data-seta="proxima" aria-label={rotuloProximo}>
                <Seta para="proxima" />
              </button>
            </div>
            <a href={ctaHref} className="botao mesa-cta">
              {cta}
            </a>
          </div>
        </div>
      </div>

      {/* A FOLHA. A profundidade abre POR CIMA, então a cena nunca muda de altura por causa de um
          texto longo. O fechar tem palavra escrita, porque ícone sozinho não ensina ninguém, e a
          mesma mulher da seção 3 anda na aba de cima: é isso que dá assinatura ao card. */}
      <dialog
        className="folha-cartao"
        ref={folha}
        onClick={(e) => {
          if (e.target === folha.current) folha.current?.close();
        }}
        onClose={() => {
          setAberta(null);
          window.dispatchEvent(new CustomEvent("cora:travar-rolagem", { detail: false }));
        }}
      >
        {folhaAtual ? (
          <div className="folha-caixa">
            <div className="folha-aba">
              <FiguraAndando className="figura-na-folha" />
            </div>
            <div className="folha-topo">
              <h3>
                <Inteiras texto={folhaAtual.titulo} />
              </h3>
              <button
                type="button"
                className="folha-fechar"
                autoFocus
                onClick={() => folha.current?.close()}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" className="folha-x">
                  <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" />
                </svg>
                <span>{fechar}</span>
              </button>
            </div>
            {/* data-lenis-prevent: a Lenis intercepta roda e toque no documento inteiro e
                impede o padrao, entao sem esta marca o corpo do card simplesmente nao rola.
                Era esse o bug que o Gabriel viu no desktop e no celular. */}
            <div className="folha-corpo" data-lenis-prevent>
              {folhaAtual.conteudo}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
