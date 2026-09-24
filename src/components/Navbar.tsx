"use client";

import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { IDIOMAS_PUBLICADOS } from "@/i18n/routing";
import { Logo } from "./Logo";
import { CROSSFADE, DISCLOSE, useHideOnScroll } from "./ui/hide-on-scroll";
import { MenuToggleIcon } from "./ui/menu-toggle-icon";
import { Drawer, DrawerClose, DrawerPopup, DrawerTitle, DrawerTrigger } from "./ui/drawer";

/**
 * A barra de navegação (Passe 2, 2026-09-11). Logo horizontal à esquerda, três âncoras e o botão
 * no desktop; no celular, o hambúrguer à esquerda e o símbolo no centro.
 *
 * TRÊS COMPONENTES DO CATÁLOGO, cada um com a animação dele:
 * - Hide On Scroll (23532): a barra sai ao descer e volta ao subir, na mola do autor. Ela fica
 *   à vista no topo, com o menu aberto e com o foco de teclado dentro dela. Quando ela flutua sobre
 *   o conteúdo, aparece embaixo dela o fio fino da marca.
 * - Menu Toggle Icon (8718): o traço do hambúrguer se enrola e vira o X.
 * - Drawer (11444): o menu do celular é uma gaveta que vem da esquerda e fecha arrastando, com os
 *   links em Gambetta e a pílula ao pé. Acima da pílula, a troca de idioma: no celular é na gaveta
 *   que se procura, e o rodapé fica longe demais numa página deste tamanho (pedido do Gabriel,
 *   2026-09-11). O rodapé continua com a dele.
 *
 * POSSE DO MOVIMENTO. A casca (`header.navbar`) é do GSAP: é ela que sai quando uma cena presa
 * toma a tela (MovimentoProvider). O corpo da barra (`.navbar-corpo`) é do Motion: é ele que sai ao
 * descer. Dois elementos, dois donos, nenhuma briga pelo mesmo transform.
 */
export function Navbar({ pagina = "home" }: { pagina?: "home" | "journal" }) {
  const t = useTranslations("nav");
  const h = useTranslations("hero");
  const locale = useLocale();
  const reduzido = useReducedMotion();
  const [aberto, setAberto] = useState(false);
  const [focoDentro, setFocoDentro] = useState(false);
  const { hidden, atTop } = useHideOnScroll({ pinned: aberto || focoDentro });

  /* para onde ir depois que a gaveta terminar de fechar */
  const destino = useRef<string | null>(null);
  const primeiraVez = useRef(true);

  /* A rolagem da página para enquanto a gaveta está aberta. Com a Lenis no comando, travar o
     overflow não basta: quem para é ela (o MovimentoProvider ouve este aviso). */
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    window.dispatchEvent(new CustomEvent("cora:travar-rolagem", { detail: aberto }));
  }, [aberto]);

  /* Com a gaveta aberta, o botão fixo do rodapé sai de baixo dela: duas pílulas no pé da tela
     disputariam o mesmo toque. */
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("menu-aberto", aberto);
    return () => raiz.classList.remove("menu-aberto");
  }, [aberto]);

  /* FORA DA HOME (o journal), as âncoras voltam para a home: "#services" vira "/#services" ou
     "/pt#services". O formulário ("#form") continua na própria página: o rodapé é o mesmo. */
  const emCasa = pagina === "home";
  const casa = locale === "en" ? "/" : `/${locale}`;
  const ancora = (h: string) => (emCasa ? h : `${casa}${h}`);
  const journal = locale === "en" ? "/journal" : `/${locale}/journal`;
  const links = [
    { href: ancora("#services"), label: t("services") },
    { href: ancora("#about"), label: t("about") },
    { href: journal, label: t("journal") },
    { href: ancora("#faq"), label: t("faq") },
  ];
  /* a troca de idioma leva à MESMA página no outro idioma: a home ou o journal */
  const caminhoIdioma = emCasa ? "/" : "/journal";

  /* Link dentro da gaveta: primeiro ela fecha e a rolagem volta, DEPOIS a página vai até a seção.
     Ir antes seria rolar uma página travada. */
  const irDepois = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    /* só âncora DESTA página espera a gaveta fechar; link para outra página segue direto */
    if (!href.startsWith("#")) {
      setAberto(false);
      return;
    }
    e.preventDefault();
    destino.current = href;
    setAberto(false);
  };

  const aoTerminar = (estaAberto: boolean) => {
    if (estaAberto || !destino.current) return;
    const alvo = document.querySelector(destino.current);
    destino.current = null;
    alvo?.scrollIntoView({ behavior: reduzido ? "auto" : "smooth" });
  };

  const aoSairFoco = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocoDentro(false);
  };

  return (
    <header className="navbar" onFocus={() => setFocoDentro(true)} onBlur={aoSairFoco}>
      <Drawer open={aberto} onOpenChange={setAberto} onOpenChangeComplete={aoTerminar}>
        <motion.div
          className="navbar-corpo"
          initial={false}
          animate={{ y: hidden ? "-100%" : "0%" }}
          transition={reduzido ? { duration: 0 } : DISCLOSE}
        >
          <div className="container navbar-inner">
            <DrawerTrigger className="hamburguer lg:hidden" aria-label={t("menu")}>
              <MenuToggleIcon open={aberto} className="hamburguer-icone" />
            </DrawerTrigger>

            <a href={emCasa ? "#top" : casa} className="navbar-logo" aria-label="Cora Perinatal Care">
              <span className="hidden md:block">
                <Logo variante="horizontal" altura={40} />
              </span>
              <span className="md:hidden">
                <Logo variante="simbolo" altura={40} />
              </span>
            </a>

            {/* AS QUATRO ÂNCORAS SÓ A PARTIR DE 1024 (2026-09-23). Com "The Cora Journal" no menu, a
                768px os links e o botão passavam 81px da coluna (medido). No tablet o menu vai para a
                gaveta e o botão fica à vista. */}
            <nav className="hidden lg:flex items-center gap-8" aria-label={t("primary")}>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="navbar-link"
                  aria-current={!emCasa && l.href === journal ? "page" : undefined}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <a href="#form" className="botao hidden md:inline-flex">
              {h("cta")}
            </a>
          </div>

          {/* o fio da marca embaixo da barra, só quando ela flutua sobre o conteúdo */}
          <motion.span
            aria-hidden="true"
            className="navbar-fio"
            initial={false}
            animate={{ opacity: atTop ? 0 : 1 }}
            transition={reduzido ? { duration: 0 } : CROSSFADE}
          />
        </motion.div>

        <DrawerPopup>
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <div className="gaveta-topo">
            <DrawerClose className="hamburguer" aria-label={t("close")}>
              <XDaGaveta />
            </DrawerClose>
          </div>
          <nav aria-label={t("primary")}>
            <ul className="gaveta-links">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => irDepois(e, l.href)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="gaveta-pe">
            {/* Trocar de idioma fecha a gaveta antes: a página nova não herda a rolagem travada. */}
            {IDIOMAS_PUBLICADOS.length > 1 ? (
              <nav className="gaveta-idioma" aria-label={t("language")}>
                <Link
                  href={caminhoIdioma}
                  locale="en"
                  hrefLang="en"
                  lang="en"
                  aria-current={locale === "en" ? "true" : undefined}
                  className="link-linha"
                  onClick={() => setAberto(false)}
                >
                  {t("english")}
                </Link>
                <span aria-hidden="true">/</span>
                <Link
                  href={caminhoIdioma}
                  locale="pt"
                  hrefLang="pt"
                  lang="pt-BR"
                  aria-current={locale === "pt" ? "true" : undefined}
                  className="link-linha"
                  onClick={() => setAberto(false)}
                >
                  {t("portuguese")}
                </Link>
              </nav>
            ) : null}
            <a href="#form" className="botao" onClick={(e) => irDepois(e, "#form")}>
              {h("cta")}
            </a>
          </div>
        </DrawerPopup>
      </Drawer>
    </header>
  );
}

/**
 * O X de dentro da gaveta ocupa o lugar exato do hambúrguer. A gaveta monta a cada abertura, e o
 * ícone nasce hambúrguer e se enrola no quadro seguinte: quem abre vê o mesmo gesto do botão da
 * barra, agora na frente do painel.
 */
function XDaGaveta() {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setArmado(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  return <MenuToggleIcon open={armado} className="hamburguer-icone" />;
}
