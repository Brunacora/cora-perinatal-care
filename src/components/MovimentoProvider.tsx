"use client";

import Lenis from "lenis";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* A instância da Lenis vive só neste módulo: a trava por evento, a âncora e o destino leem daqui.
   Com prefers-reduced-motion ela nem existe: rolagem nativa, e os scrubs assumem o estado final
   (gsap.matchMedia em cada cena). */
let lenisAtual: Lenis | null = null;

/**
 * ROLAR ATÉ UMA POSIÇÃO ABSOLUTA, PELA LENIS (2026-09-23).
 *
 * `window.scrollTo({ behavior: "smooth" })` NÃO funciona de forma confiável com a Lenis ligada:
 * ela dirige a rolagem no próprio laço e puxa a página de volta para o alvo dela. Medido nas setas
 * de capítulo da seção 4: três cliques seguidos em "próximo" avançavam UM capítulo só, e o
 * "anterior" não voltava. As marcas do pé sofriam do mesmo mal e só pareciam certas porque eu
 * esperava quase dois segundos entre um clique e outro.
 *
 * Quem precisa mover a página pede aqui. Sem a Lenis (movimento reduzido), cai no nativo.
 */
export function rolarPara(y: number) {
  const lenis = lenisAtual;
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/**
 * A camada global da câmera (Passe 3, camada 1, antecipada em 2026-09-10 a pedido do Gabriel):
 * Lenis dirigida pelo ticker do GSAP, para rolagem e scrub ficarem no mesmo relógio, e o
 * ScrollTrigger avisado a cada rolagem. Sem isso o scrub treme.
 */
export function MovimentoProvider({ children }: { children: ReactNode }) {
  /* A LENIS NASCE DA CLASSE CORE NUM EFEITO, e o provider devolve SEMPRE o mesmo fragmento.
     Na versão 1 o movimento reduzido era lido com useSyncExternalStore, que no servidor responde
     "reduzido", e o provider trocava o fragmento pelo ReactLenis logo depois da hidratação. Tipo de
     elemento diferente na mesma posição remonta tudo o que está dentro. Medido em 2026-09-14: para
     quem NÃO pediu movimento reduzido, a página inteira era hidratada e jogada fora meio segundo
     depois (o <main> com 620 elementos, a placa e o h1 da hero), com uns 200ms a mais de tarefa
     longa. E o ref do ReactLenis chegava vazio neste efeito: o ScrollTrigger.update nunca se ligava
     à rolagem da Lenis.
     A preferência do sistema é reavaliada ao vivo: se mudar, a Lenis é destruída ou recriada, sem
     remontar nada. */
  useEffect(() => {
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let desligar: (() => void) | null = null;

    function ligar() {
      /* as três peças do relógio, juntas: a Lenis sem laço próprio, o ticker do GSAP dirigindo sem
         pular tempo, e o ScrollTrigger avisado a cada rolagem */
      const lenis = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 1 });
      const atualizar = (tempo: number) => lenis.raf(tempo * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(atualizar);
      gsap.ticker.lagSmoothing(0);
      lenisAtual = lenis;

      desligar = () => {
        desligar = null;
        lenisAtual = null;
        gsap.ticker.remove(atualizar);
        lenis.destroy();
      };
    }

    function avaliar() {
      desligar?.();
      if (!preferencia.matches) ligar();
    }

    avaliar();
    preferencia.addEventListener("change", avaliar);
    return () => {
      preferencia.removeEventListener("change", avaliar);
      desligar?.();
    };
  }, []);

/* A TROCA DE PÁGINA (2026-09-23, com o journal o site deixou de ter uma página só). Na navegação
     do Next o provider NÃO remonta: a Lenis continua com a posição e a altura da página anterior, e
     o ScrollTrigger mede a página nova antes de ela assentar (fontes, a passagem da capa). O
     resultado, relatado pelo Gabriel: ao trocar de página as coisas "não carregavam" ao descer.
     A cada troca: a Lenis volta ao topo sem animar e remede, e a câmera é recalculada duas vezes,
     no quadro seguinte e depois das fontes. */
  const pathname = usePathname();
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const lenis = lenisAtual;
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
    lenis?.resize();
    let quadro = requestAnimationFrame(() => {
      quadro = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    let vivo = true;
    document.fonts?.ready.then(() => vivo && ScrollTrigger.refresh());
    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
    };
  }, [pathname]);

  /* Travar a rolagem quando um diálogo abre. Com a Lenis no comando, overflow: hidden no html
     não basta: é ela quem precisa parar, senão a página corre atrás da folha aberta. */
  useEffect(() => {
    const aoTravar = (e: Event) => {
      const travar = (e as CustomEvent<boolean>).detail;
      const lenis = lenisAtual;
      if (travar) lenis?.stop();
      else lenis?.start();
    };
    window.addEventListener("cora:travar-rolagem", aoTravar as EventListener);
    return () => window.removeEventListener("cora:travar-rolagem", aoTravar as EventListener);
  }, []);

  /* A RESTAURAÇÃO DE ROLAGEM DO NAVEGADOR é a causa do bug de "seções misturadas" ao recarregar
     o site no meio da página. O navegador devolve a rolagem à posição antiga ANTES de o React
     montar e de o ScrollTrigger medir; as cenas presas (seções 3 e 4) então são medidas a partir
     de um layout que ainda vai mudar, e o espaçador do pin nasce com a altura errada. O resultado
     é exatamente o que se vê: uma seção por cima da outra.
     A correção é desligar a restauração e começar sempre do topo. Também se apaga a memória de
     rolagem do próprio ScrollTrigger, que guarda posições entre recargas. */
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const antes = history.scrollRestoration;
    history.scrollRestoration = "manual";
    ScrollTrigger.clearScrollMemory("manual");
    /* instantâneo: o html tem scroll-behavior smooth, e uma subida animada ainda estaria correndo
       enquanto as cenas medem */
    window.scrollTo({ top: 0, behavior: "instant" });

    /* QUEM CHEGA COM UMA ÂNCORA NO ENDEREÇO (um link compartilhado, ou uma recarga em
       "?service=classes#form") vai para ela, mas só DEPOIS de a página carregar e as cenas
       medirem. Medido em 2026-09-11: o "voltar ao topo" acima engolia a âncora, e o botão de
       serviço pré-selecionava o formulário e deixava a pessoa no topo da página. Saltar cedo
       também não serve: cada refresh do ScrollTrigger rola ao topo para medir e volta, e a Lenis
       guarda a própria posição; o salto só pega depois do load, das fontes e de um refresh, e pela
       própria Lenis quando ela existe. */
    const id = decodeURIComponent(window.location.hash.slice(1));
    let cancelado = false;
    let espera = 0;
    const ir = () => {
      if (cancelado) return;
      const alvo = id ? document.getElementById(id) : null;
      if (!alvo) return;
      ScrollTrigger.refresh();
      const lenis = lenisAtual;
      if (lenis) lenis.scrollTo(alvo, { immediate: true, force: true });
      else alvo.scrollIntoView({ behavior: "instant" });
    };
    const aoCarregar = () => {
      espera = window.setTimeout(() => {
        const fontes = document.fonts?.ready ?? Promise.resolve();
        fontes.then(ir).catch(ir);
      }, 150);
    };
    if (id) {
      if (document.readyState === "complete") aoCarregar();
      else window.addEventListener("load", aoCarregar, { once: true });
    }
    return () => {
      cancelado = true;
      window.clearTimeout(espera);
      window.removeEventListener("load", aoCarregar);
      history.scrollRestoration = antes;
    };
  }, []);

  /* OS BOTÕES DE SERVIÇO ("?service=inperson#form") mudam a busca do endereço, e um link comum
     recarregaria a página inteira: a hero tocaria de novo e a pessoa perderia o fio. Aqui o clique
     troca o endereço SEM recarregar, avisa o formulário ("cora:destino", que pré-seleciona o
     serviço) e leva a pessoa até ele pela mesma rolagem do site. A âncora simples ("#form", sem
     busca nova) continua com o navegador. */
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target")) return;
      const url = new URL(link.getAttribute("href") ?? "", window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!url.hash || url.search === window.location.search) return;
      const alvo = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!alvo) return;
      e.preventDefault();
      history.pushState(null, "", url.pathname + url.search + url.hash);
      window.dispatchEvent(new Event("cora:destino"));
      const lenis = lenisAtual;
      if (lenis) lenis.scrollTo(alvo);
      else alvo.scrollIntoView();
    };
    document.addEventListener("click", aoClicar);
    return () => document.removeEventListener("click", aoClicar);
  }, []);

  /* A CENA IMERSIVA TEM UM DONO SÓ, e é aqui.
     Enquanto alguma cena está PRESA, a barra de navegação e o botão fixo saem: a cena toma a
     tela inteira e devolve mais de 100px de altura ao conteúdo no celular. Na hero e em toda
     seção que rola normalmente, a navegação fica visível.
     Por que aqui e não dentro de cada cena: quando cada cena cuidava da própria classe, bastava
     recarregar a página no meio do site para ela travar ligada. O gatilho era medido enquanto o
     navegador ainda reportava a rolagem antiga, concluía "estou ativa", e depois da rolagem
     voltar ao topo nada mais avisava o contrário. Aqui o estado é DERIVADO a cada quadro a
     partir dos gatilhos que existem de verdade, então ele não tem como ficar preso. */
  useEffect(() => {
    const raiz = document.documentElement;
    let presas: ScrollTrigger[] = [];
    let estava = false;

    /* a lista de cenas presas só muda quando o ScrollTrigger remede; o quadro a quadro apenas
       lê o estado delas, que é barato */
    const listar = () => {
      presas = ScrollTrigger.getAll().filter((st) => st.pin);
      reconciliar();
    };
    const reconciliar = () => {
      const agora = presas.some((st) => st.isActive);
      if (agora === estava) return;
      estava = agora;
      raiz.classList.toggle("cena-imersiva", agora);
      /* a barra sai pelo GSAP. A transição de CSS aqui ficava um passo atrás do estado real:
         a barra sumia na hero e aparecia na cena presa, exatamente o contrário do desejado.
         A busca é feita na hora, não uma vez só: guardada em variável ela pode ter sido
         capturada antes de a barra existir. */
      const navbar = document.querySelector<HTMLElement>(".navbar");
      if (navbar) {
        gsap.to(navbar, {
          yPercent: agora ? -100 : 0,
          duration: 0.42,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    listar();
    ScrollTrigger.addEventListener("refresh", listar);
    gsap.ticker.add(reconciliar);
    return () => {
      ScrollTrigger.removeEventListener("refresh", listar);
      gsap.ticker.remove(reconciliar);
      raiz.classList.remove("cena-imersiva");
      const barra = document.querySelector<HTMLElement>(".navbar");
      if (barra) gsap.set(barra, { yPercent: 0 });
    };
  }, []);

  /* No celular, mostrar e esconder a barra de endereço muda a altura da janela e dispara um
     "resize" a cada rolagem. Cada resize refaz TODAS as medidas e é a segunda fonte do
     embaralhamento. ignoreMobileResize manda o ScrollTrigger ignorar essa mudança de altura. */
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }, []);

  /* Recalcular os gatilhos quando o layout muda depois da montagem. Sem isto, toda cena ligada
     à rolagem fica com posições velhas: as fontes trocam e as fotos (lazy) chegam DEPOIS de o
     ScrollTrigger medir, e a cena acende na hora errada. Vale para o site inteiro, não por cena. */
  useEffect(() => {
    let pendente = 0;
    let rolando = 0;

    /* NUNCA REMEDIR NO MEIO DA ROLAGEM. O refresh do ScrollTrigger guarda e devolve a posição de
       rolagem para medir, e no iPhone essa ida e volta aparece: a página salta de volta para onde
       estava antes do gesto (o Gabriel viu no iPhone em 2026-09-11). Como as fotos entram em caixas
       de tamanho fixo, o layout não muda quando elas chegam: dá para esperar a pessoa parar. */
    const marcarRolagem = () => {
      window.clearTimeout(rolando);
      rolando = window.setTimeout(() => {
        rolando = 0;
      }, 260);
    };
    const recalcular = () => {
      window.clearTimeout(pendente);
      pendente = window.setTimeout(() => {
        if (rolando) return recalcular();
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("scroll", marcarRolagem, { passive: true });
    /* FOTO QUE CHEGA NÃO PEDE MEDIDA NOVA. Toda foto do site mora numa caixa de tamanho definido
       (next/image com `fill` ou com width e height), então o layout não muda quando ela carrega.
       Remedir a cada foto era o que fazia a página saltar de volta uma ou duas seções no iPhone,
       porque as fotos preguiçosas carregam JUSTAMENTE quando a seção nova entra na tela. Ficam as
       duas medidas que mudam layout de verdade: as fontes e o fim do carregamento da página. */
    window.addEventListener("load", recalcular);
    document.fonts?.ready.then(recalcular).catch(() => {});
    return () => {
      window.clearTimeout(pendente);
      window.clearTimeout(rolando);
      window.removeEventListener("scroll", marcarRolagem);
      window.removeEventListener("load", recalcular);
    };
  }, []);

  return <>{children}</>;
}
