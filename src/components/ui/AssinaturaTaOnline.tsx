"use client";

import { useEffect, useRef } from "react";
import "./assinatura-ta-online.css";

/**
 * A ASSINATURA DA TÁ ONLINE AGÊNCIA, versão 2 (aprovada pelo Gabriel em 2026-09-11).
 *
 * COMPONENTE UNIVERSAL: vai no fim de todo site da agência. A fonte de verdade vive no Cérebro
 * (`05-Repertorio/componentes-ta-online/assinatura-rodape`), com a nota de como inserir; esta é a
 * cópia instalada no site da Bruna. Mudou aqui, muda lá.
 *
 * O que ela é, e por quê:
 * - TUDO À MOSTRA: a assinatura, a tese da agência e os dois links aparecem de primeira. Quem chega
 *   ao fim de um site nosso e gostou sabe na hora quem fez e como falar com a gente, sem gesto para
 *   descobrir (a versão 1 escondia isso atrás do mouse e foi reprovada com razão).
 * - COR ZERO: tudo em `currentColor`. Herda a cor do texto do lugar onde entra; nenhuma cor da
 *   agência toca a paleta do cliente. A identidade está na FORMA: o TÁ ON? da logo.
 * - O GESTO NASCE DO NOME: "TÁ ON?" é uma pergunta, e o site responde. Ao entrar na tela o ON
 *   acende, o gancho do ponto de interrogação some e fica o ponto final, que respira como a luz de
 *   quem está online. A palavra da tese acende junto e o sublinhado dos links se desenha.
 * - RESPONDE AO ESPAÇO: uma linha onde cabe, três onde é estreito, por container query (a largura
 *   do lugar, não a da tela).
 * - SEM BIBLIOTECA: nem GSAP, nem Three.js, nem pacote de ícones. Os dois ícones são os traços do
 *   Phosphor (licença MIT) copiados aqui, e a logo é SVG próprio.
 * - LINK COM NOFOLLOW: o mesmo crédito em dezenas de sites, com link seguido, parece esquema de link
 *   para o Google. O nofollow protege o SEO do cliente e o nosso.
 * - "WhatsApp" NO LUGAR DO NÚMERO: o telefone do cliente costuma estar logo acima; dois números um
 *   embaixo do outro confundem quem quer ligar para ele.
 *
 * Quem hospeda decide o lugar e o fundo: ela não tem fundo próprio. Precisa de contraste de texto
 * pequeno (4,5:1) contra o que estiver atrás.
 */

const WHATSAPP = "https://wa.me/5516993839878";
const INSTAGRAM = "https://www.instagram.com/taonlineagencia";

const COPIA = {
  en: {
    rotulo: "Site by",
    tese: ["Visibility", " that lives up to your work."],
    naRede: "Tá Online Agência on Instagram",
    noWhatsapp: "Tá Online Agência on WhatsApp",
  },
  pt: {
    rotulo: "Desenvolvido por",
    tese: ["Visibilidade", " à altura do seu trabalho."],
    naRede: "Tá Online Agência no Instagram",
    noWhatsapp: "Tá Online Agência no WhatsApp",
  },
} as const;

export type IdiomaAssinatura = keyof typeof COPIA;

/**
 * O TÁ ON? em contorno vetorial: a Montserrat Black 900 (licença SIL OFL) que o Gabriel aprovou na
 * proposta, contornada em 2026-09-11. Unidades de 1000 por eme, linha de base em y = 0. O ponto de
 * interrogação vem em duas peças, o gancho e o ponto, para o gancho sumir e o ponto ficar.
 */
const LOGO = {
  viewBox: "-20 -941 4079 981",
  ta: "M445 0L209 0L209-517L4-517L4-700L650-700L650-517L445-517M885 0L645 0L951-700L1183-700L1489 0L1245 0L1198-122L932-122L885 0M997-292L1133-292L1065-468L997-292M1112-757L962-757L1094-917L1309-917",
  on: "M2215 16Q2129 16 2056.5-11Q1984-38 1931-87.5Q1878-137 1848.5-204Q1819-271 1819-350Q1819-430 1848.5-496.5Q1878-563 1931-612.5Q1984-662 2056.5-689Q2129-716 2214-716Q2300-716 2372-689Q2444-662 2497-612.5Q2550-563 2579.5-496.5Q2609-430 2609-350Q2609-271 2579.5-204Q2550-137 2497-87.5Q2444-38 2372-11Q2300 16 2215 16M2214-175Q2247-175 2275.5-187Q2304-199 2325.5-221.5Q2347-244 2359-276.5Q2371-309 2371-350Q2371-391 2359-423.5Q2347-456 2325.5-478.5Q2304-501 2275.5-513Q2247-525 2214-525Q2181-525 2152.5-513Q2124-501 2102.5-478.5Q2081-456 2069-423.5Q2057-391 2057-350Q2057-309 2069-276.5Q2081-244 2102.5-221.5Q2124-199 2152.5-187Q2181-175 2214-175M2935 0L2705 0L2705-700L2899-700L3165-382L3165-700L3395-700L3395 0L3201 0L2935-318",
  gancho: "M3875-268L3669-268Q3669-298 3678.5-322Q3688-346 3702.5-365Q3717-384 3733.5-399.5Q3750-415 3764.5-429Q3779-443 3788.5-457Q3798-471 3798-486Q3798-509 3778.5-521Q3759-533 3731-533Q3699-533 3671-515Q3643-497 3627-465L3449-554Q3487-626 3564-671Q3641-716 3761-716Q3840-716 3901.5-694.5Q3963-673 3999-630.5Q4035-588 4035-525Q4035-487 4023.5-458Q4012-429 3993.5-407.5Q3975-386 3955-368Q3935-350 3916.5-334.5Q3898-319 3886.5-303Q3875-287 3875-268",
  ponto: "M3772 10Q3714 10 3677-25.5Q3640-61 3640-110Q3640-160 3677-194Q3714-228 3772-228Q3831-228 3867.5-194Q3904-160 3904-110Q3904-61 3867.5-25.5Q3831 10 3772 10",
  centroDoPonto: { x: 3772, y: -109 },
  raioDoPonto: 132,
};

/** Os traços dos ícones do Phosphor (peso regular, licença MIT), para não depender do pacote. */
const ICONE_WHATSAPP =
  "M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z";
const ICONE_INSTAGRAM =
  "M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z";

/* O recorte que anima fica NAS PRÓPRIAS LETRAS (clip-path em CSS), e não num <clipPath> do SVG:
   o que mora dentro de um <clipPath> nunca é desenhado, e o Chrome não roda transição nele. Medido
   em 2026-09-11: com a classe já acesa, o retângulo do recorte ficava parado no começo. */
function LogoTaOn() {
  return (
    <svg className="tao-logo" viewBox={LOGO.viewBox} aria-hidden="true" focusable="false">
      <path className="tao-cheio" d={LOGO.ta} />
      <path className="tao-oco" d={LOGO.on} />
      {/* o ON cheio, revelado da esquerda para a direita por cima do vazado */}
      <path className="tao-cheio tao-on-cheio" d={LOGO.on} />
      {/* o gancho do "?", que se recolhe de cima para baixo até sobrar só o ponto */}
      <path className="tao-cheio tao-gancho" d={LOGO.gancho} />
      <path className="tao-cheio tao-ponto" d={LOGO.ponto} />
      <circle className="tao-halo" cx={LOGO.centroDoPonto.x} cy={LOGO.centroDoPonto.y} r={LOGO.raioDoPonto} />
    </svg>
  );
}

function Icone({ d }: { d: string }) {
  return (
    <svg className="tao-icone" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export function AssinaturaTaOnline({ idioma = "en" }: { idioma?: IdiomaAssinatura }) {
  const c = COPIA[idioma];
  const raiz = useRef<HTMLDivElement | null>(null);

  /* Acende uma vez, ao entrar na tela. Com movimento reduzido, já nasce aceso (o estado final é o
     legível). A classe vai direto no elemento: não há estado a re-renderizar. */
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido || !("IntersectionObserver" in window)) {
      el.classList.add("aceso");
      return;
    }
    let espera = 0;
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        espera = window.setTimeout(() => el.classList.add("aceso"), 180);
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(espera);
    };
  }, []);

  return (
    <div className="tao" ref={raiz}>
      <div className="tao-corpo">
        <p className="tao-assina">
          <span className="tao-rotulo">{c.rotulo}</span>
          <a className="tao-marca" href={INSTAGRAM} target="_blank" rel="nofollow noopener noreferrer" aria-label={c.naRede}>
            <LogoTaOn />
          </a>
        </p>
        <p className="tao-tese">
          <span className="tao-tese-vazado">{c.tese[0]}</span>
          {c.tese[1]}
        </p>
        <ul className="tao-contatos">
          <li>
            <a className="tao-link" href={WHATSAPP} target="_blank" rel="nofollow noopener noreferrer" aria-label={c.noWhatsapp}>
              <Icone d={ICONE_WHATSAPP} />
              <span>WhatsApp</span>
            </a>
          </li>
          <li>
            <a className="tao-link" href={INSTAGRAM} target="_blank" rel="nofollow noopener noreferrer" aria-label={c.naRede}>
              <Icone d={ICONE_INSTAGRAM} />
              <span>@taonlineagencia</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
