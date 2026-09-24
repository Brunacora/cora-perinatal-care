import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A caligrafia de entrada do site, num lugar só (movimento.md, "A entrada de texto" e verbo 2).
 * Passe 3, 2026-09-11. Toda seção que precisa destes gestos chama daqui, para o site ler como uma
 * câmera só e não como dez truques: mesma máscara, mesmo trecho de rolagem, mesmas amplitudes.
 * Quem chama cuida do reduced-motion (o estado final), dentro do próprio gsap.matchMedia.
 */

/**
 * O TÍTULO, linha a linha, por baixo de uma máscara, em TRILHO CURTO: entra enquanto ele sobe de
 * 90% a 65% da tela (um quarto de tela), ligado à rolagem e não disparado. Quem volta a página
 * vê o título recolher, porque a câmera anda para os dois lados.
 * As linhas precisam vir do SplitText com `mask: "lines"`.
 */
export function tituloEmTrilho(linhas: Element[], gatilho: Element) {
  if (!linhas.length) return null;
  return gsap.fromTo(
    linhas,
    { yPercent: 106, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      ease: "power1.out",
      stagger: 0.14,
      scrollTrigger: { trigger: gatilho, start: "top 90%", end: "top 65%", scrub: 0.6 },
    },
  );
}

/**
 * O CORPO de texto não é cortado em linhas (custo e leitura): entra por opacidade e 6px de subida,
 * UMA vez. É a única exceção de gatilho nas seções autorais, e está escrita assim no movimento.md.
 */
export function corpoUmaVez(els: Element[]) {
  return els.map((el) =>
    gsap.fromTo(
      el,
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    ),
  );
}

/**
 * A CAMADA que se separa (verbo 2): sobe uma fração da ALTURA DA TELA enquanto a seção passa, da
 * entrada pela base até a saída pelo topo. Medida em altura de tela e não em porcentagem do
 * elemento (lição da hero: com yPercent a ordem de profundidade sai trocada). Parte do repouso,
 * então a seção é medida no lugar certo. No celular, metade da amplitude.
 */
export function camada(el: Element, vh: number, gatilho: Element, estreito: boolean) {
  const f = estreito ? 0.5 : 1;
  return gsap.fromTo(
    el,
    { y: 0 },
    {
      y: () => -window.innerHeight * (vh / 100) * f,
      ease: "none",
      scrollTrigger: {
        trigger: gatilho,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    },
  );
}
