/**
 * Junta nomes de classe, ignorando falso. É o `cn` que os componentes do 21st.dev esperam.
 *
 * A versão original deles usa clsx + tailwind-merge. Aqui não faz falta: este projeto quase não
 * usa classe utilitária do Tailwind, então não existe conflito de utilitárias para resolver, e
 * duas dependências a mais para concatenar string seria peso sem retorno.
 */
export function cn(...partes: Array<string | false | null | undefined>) {
  return partes.filter(Boolean).join(" ");
}
