"use client";

import { useSyncExternalStore } from "react";
import { rolarPara } from "@/components/MovimentoProvider";
import { assinarLeituras, estadoDaLeitura, progressoDe } from "@/lib/leituras";

/**
 * O CADERNO QUE LEMBRA, do lado do artigo (2026-09-24): se a leitora parou no meio deste texto NESTE
 * aparelho, a autoria oferece voltar de onde ela parou. Sem leitura guardada, nada aparece (e no
 * servidor nunca aparece: a memória é só do aparelho dela).
 *
 * A conta desfaz a do fio de leitura: o progresso vai de "o topo do corpo a 70% da tela" até "o pé do
 * corpo a 70% da tela".
 */
export function RetomarLeitura({ slug, rotulo }: { slug: string; rotulo: string }) {
  const lido = useSyncExternalStore(assinarLeituras, () => progressoDe(slug), () => 0);
  if (estadoDaLeitura(lido) !== "meio") return null;

  const retomar = () => {
    const corpo = document.querySelector<HTMLElement>(".artigo-leitura .prosa");
    if (!corpo) return;
    const caixa = corpo.getBoundingClientRect();
    const topo = caixa.top + window.scrollY;
    rolarPara(Math.max(0, topo - window.innerHeight * 0.7 + lido * caixa.height));
  };

  return (
    <button type="button" className="retomar-leitura" onClick={retomar}>
      <span className="retomar-fio" aria-hidden="true">
        <span style={{ transform: `scaleX(${lido})` }} />
      </span>
      {rotulo}
    </button>
  );
}
