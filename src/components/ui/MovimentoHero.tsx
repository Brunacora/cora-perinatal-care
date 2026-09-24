"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * PICO 1, a câmera da hero (movimento.md, "o desenho vira foto").
 *
 * Esta é a camada da FRENTE da hero e quem dirige as outras. Ela existe como componente de
 * cliente separado para a hero continuar sendo componente de servidor: quem precisa do navegador
 * é só o movimento, não o conteúdo, e o texto e a placa continuam chegando prontos do servidor
 * (a placa é o LCP da página).
 *
 * No CARREGAMENTO: o texto já está lá, e o símbolo da logo se revela de cima para baixo, como se
 * a linha estivesse sendo desenhada. O vetor da marca é feito de formas preenchidas, não de
 * traço, então não dá para usar DrawSVG nele: a máscara que corre pelo desenho é a tradução
 * honesta do mesmo gesto. As borboletas chegam depois, por opacidade.
 *
 * AO ROLAR (scrub, o verbo "as camadas se separam"): a placa do jardim sobe pouco, o texto sobe
 * mais, o símbolo sobe mais ainda e os hibiscos da frente sobem o dobro, com um balanço mínimo.
 * É o parallax por camada do sistema, e é o que dá profundidade sem nenhum efeito novo.
 *
 * AS BORBOLETAS são as mesmas da seção 4, no mesmo voo contínuo: elas nascem aqui e reaparecem
 * lá. É o fio que costura a hero ao resto do site.
 *
 * Reduced-motion: tudo no estado final, sem scrub e sem voo.
 * Posse: GSAP.
 */
export function MovimentoHero() {
  const raiz = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const camada = raiz.current;
      const hero = camada?.closest<HTMLElement>(".hero");
      if (!camada || !hero) return;

      const placa = hero.querySelector<HTMLElement>(".hero-plate");
      const texto = hero.querySelector<HTMLElement>(".hero-texto");
      const figura = hero.querySelector<HTMLElement>(".hero-figura");
      const simbolo = hero.querySelector<HTMLElement>(".hero-simbolo");
      const flores = gsap.utils.toArray<HTMLElement>(".hero-flor", hero);
      const borboletas = gsap.utils.toArray<HTMLElement>(".borboleta", hero);

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduzido: "(prefers-reduced-motion: reduce)",
          anima: "(prefers-reduced-motion: no-preference)",
          estreito: "(max-width: 767px)",
        },
        (ctx) => {
          const { anima, estreito } = ctx.conditions as { anima: boolean; estreito: boolean };

          if (!anima) {
            if (simbolo) gsap.set(simbolo, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 });
            gsap.set([...flores, ...borboletas], { opacity: 1 });
            return;
          }

          /* 1. A ENTRADA. O símbolo se revela de cima para baixo, como um traço sendo puxado. */
          if (simbolo) {
            gsap.fromTo(
              simbolo,
              { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.2 },
              { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.6, ease: "power2.out", delay: 0.15 },
            );
          }
          /* a entrada usa yPercent, não y: o parallax de rolagem escreve y nas mesmas flores, e
             duas animações na MESMA propriedade do MESMO elemento brigam e tremem */
          gsap.fromTo(
            flores,
            { opacity: 0, yPercent: 7 },
            { opacity: 1, yPercent: 0, duration: 1.2, ease: "power2.out", stagger: 0.18, delay: 0.35 },
          );
          gsap.fromTo(
            borboletas,
            { opacity: 0, scale: 0.88 },
            { opacity: 1, scale: 1, duration: 1, ease: "power2.out", stagger: 0.3, delay: 0.9 },
          );

          /* 2. O VOO CONTÍNUO das borboletas: não depende da rolagem, então elas estão vivas
                mesmo com a página parada. É o mesmo gesto da seção 4. */
          const voos: gsap.core.Tween[] = [];
          borboletas.forEach((b, i) => {
            const asa = b.querySelector(".borboleta-asa");
            if (asa) {
              voos.push(
                gsap.to(asa, {
                  scaleX: 0.56,
                  duration: 0.27 + i * 0.05,
                  ease: "sine.inOut",
                  repeat: -1,
                  yoyo: true,
                  transformOrigin: "50% 50%",
                }),
                gsap.to(asa, {
                  rotation: i === 0 ? 8 : -7,
                  duration: 3.6 + i * 0.8,
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
                { y: i === 0 ? -12 : 9 },
                { y: i === 0 ? 13 : -11, duration: 4 + i, ease: "sine.inOut", repeat: -1, yoyo: true },
              ),
            );
          });

          /* 3. O BALANÇO das flores, mínimo e lento: elas são papel, não vento. */
          flores.forEach((f, i) => {
            voos.push(
              gsap.to(f, {
                rotation: i === 0 ? 1.4 : -1.4,
                duration: 7 + i,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: i === 0 ? "0% 100%" : "100% 100%",
              }),
            );
          });

          /* FORA DA TELA, TUDO PARA. Borboleta e flor em laço infinito continuam consumindo quadro
             depois que a hero sai da tela, e no celular isso vira travada ao passar pelas seções
             (o Gabriel sentiu no iPhone em 2026-09-11). */
          const naTela = ScrollTrigger.create({
            trigger: hero,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => voos.forEach((t) => (self.isActive ? t.resume() : t.pause())),
          });
          if (!naTela.isActive) voos.forEach((t) => t.pause());

          /* 4. O PARALLAX POR CAMADA, ligado ao progresso da rolagem. Quanto mais perto do
                olho, mais a camada sobe: é isso que separa o mundo em profundidade.
                A medida é em ALTURA DE TELA, não em porcentagem do próprio elemento. Com
                yPercent cada camada anda em função do tamanho dela, e a ordem de profundidade
                sai trocada: a flor pequena andava menos que o símbolo grande. */
          const f = estreito ? 0.5 : 1;
          const trilho = {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          };
          const subir = (alvo: Element | Element[] | null, vh: number) => {
            if (!alvo || (Array.isArray(alvo) && !alvo.length)) return;
            gsap.fromTo(
              alvo,
              { y: 0 },
              {
                y: () => -window.innerHeight * (vh / 100) * f,
                ease: "none",
                scrollTrigger: trilho,
              },
            );
          };
          /* A amplitude das flores é MENOR que a folga que elas têm abaixo da dobra (12vh no
             celular, bem mais no desktop). Sem essa conta, a camada sobe e a borda reta do PNG
             entra em quadro no fim da hero, como um retângulo colado por cima. */
          subir(placa, 3);
          subir(texto, 5);
          subir(figura, 7);
          subir(flores, 9);
          subir(hero.querySelector(".hero-borboletas"), 16);
        },
      );
    },
    { scope: raiz },
  );

  return (
    <>
      {/* AS FLORES vão ATRÁS do conteúdo: no celular o símbolo da marca ocupa a metade de baixo
          da tela, e uma flor por cima dele viraria sujeira. Atrás, o halo de papel do símbolo
          ainda as suaviza no encontro. */}
      <div className="hero-flores" ref={raiz} data-camada="meio" aria-hidden="true">
        {/* OS HIBISCOS ESTAO ACIMA DA DOBRA, e no celular o da esquerda e o proprio LCP.
            Carregamento imediato (no Next 16 o `priority` foi aposentado): sem ele o Next
            so os busca depois do primeiro desenho, e a maior pintura da tela chega
            atrasada. O da esquerda, que e o LCP no celular, ganha prioridade alta. */}
        <Image
          src="/fotos/hero-hibiscos-esq.png"
          alt=""
          width={1536}
          height={1024}
          quality={75}
          /* A FLOR É AQUARELA MACIA, e o celular não precisa dela em resolução de retina inteira:
             medido em 2026-09-11, com 140vw o Next entregava 1920px de largura e qualidade 90 num
             aparelho de 390px, e eram os dois arquivos mais pesados do site (origem de 1,9MB e
             1,7MB, com transparência). Pedindo 72vw, o mesmo desenho na mesma posição chega com
             menos da metade dos pixels; num desenho sem aresta dura ninguém vê diferença, e o
             aparelho fraco para de engasgar. */
          sizes="(min-width: 768px) 34vw, 72vw"
          loading="eager"
          fetchPriority="high"
          className="hero-flor hero-flor-esq"
        />
        <Image
          src="/fotos/hero-hibiscos-dir.png"
          alt=""
          width={1536}
          height={1024}
          quality={75}
          sizes="(min-width: 768px) 38vw, 72vw"
          loading="eager"
          className="hero-flor hero-flor-dir"
        />
      </div>

      {/* AS BORBOLETAS são a camada mais próxima do olho, e por isso vão na frente de tudo.
          São as mesmas da seção 4: elas nascem aqui. */}
      <div className="hero-borboletas" data-camada="frente" aria-hidden="true">
        <span className="borboleta borboleta-hero-a">
          <span className="borboleta-asa">
            <Image src="/fotos/borboleta-1.png" alt="" width={483} height={501} sizes="160px" />
          </span>
        </span>
        <span className="borboleta borboleta-hero-b">
          <span className="borboleta-asa">
            <Image src="/fotos/borboleta-3.png" alt="" width={487} height={502} sizes="130px" />
          </span>
        </span>
      </div>
    </>
  );
}
