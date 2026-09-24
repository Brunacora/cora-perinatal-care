/**
 * O CADERNO QUE LEMBRA (2026-09-24): até onde a leitora leu cada artigo, guardado SÓ no aparelho
 * dela (localStorage). Nada vai para servidor nenhum. A listagem mostra o fio de tinta no artigo
 * que ficou pela metade e o arco da marca no que ela terminou; o artigo oferece voltar de onde parou.
 *
 * Lido como loja externa (useSyncExternalStore): no servidor, nenhum artigo foi lido.
 */
const CHAVE = "cora-leituras";
const ouvintes = new Set<() => void>();
let cache: Record<string, number> | null = null;
let naMemoria: Record<string, number> = {};

function ler(): Record<string, number> {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(CHAVE) ?? "{}") as Record<string, number>;
  } catch {
    cache = naMemoria;
  }
  return cache;
}

export function assinarLeituras(avisar: () => void) {
  ouvintes.add(avisar);
  const deOutraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE) return;
    cache = null;
    avisar();
  };
  window.addEventListener("storage", deOutraAba);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", deOutraAba);
  };
}

export function progressoDe(slug: string): number {
  return ler()[slug] ?? 0;
}

/** Guarda só quando a leitora AVANÇA (voltar para reler o começo não apaga o progresso). */
export function guardarProgresso(slug: string, p: number) {
  const atual = ler();
  const novo = Math.min(1, Math.max(0, Math.round(p * 100) / 100));
  if (novo <= (atual[slug] ?? 0) + 0.015 && novo < 1) return;
  if ((atual[slug] ?? 0) >= 1) return;
  cache = { ...atual, [slug]: Math.max(novo, atual[slug] ?? 0) };
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(cache));
  } catch {
    naMemoria = cache;
  }
  ouvintes.forEach((avisar) => avisar());
}

/** "meio" entre 8% e 92% do corpo; "fim" a partir de 92% (o fim do texto é o fim da leitura). */
export function estadoDaLeitura(p: number): "" | "meio" | "fim" {
  if (p >= 0.92) return "fim";
  if (p > 0.08) return "meio";
  return "";
}
