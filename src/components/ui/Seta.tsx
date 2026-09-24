/**
 * A SETA DE AVANÇAR UM CAPÍTULO (2026-09-23).
 *
 * POR QUE ELA EXISTE, e o pedido veio em áudio, não no arquivo de revisão: a Bruna revisa o site
 * de madrugada, segurando o recém-nascido, com uma mão só. Ela disse, com todas as letras, que nas
 * Classes e nas cápsulas preferia SETAS a ter de rolar até a próxima tela. No desktop ela relatou
 * o mesmo problema por outro caminho ("às vezes tem que passar o scroll mais uma vez e daí some as
 * palavras ou fica pela metade", num Mac sem mouse).
 *
 * As cenas presas continuam sendo dirigidas pela ROLAGEM, que é a espinha do site. A seta não
 * substitui o trilho: ela é um atalho para quem não pode ou não quer rolar, e leva exatamente ao
 * mesmo lugar que a marca do capítulo já levava.
 *
 * O DESENHO é a linha da marca, não um ícone de biblioteca: um traço só, com ponta redonda, na
 * espessura das outras linhas do site. A seta seguinte é a mesma peça espelhada pelo CSS, porque
 * espelhar ILUSTRAÇÃO é legítimo (o que nunca se espelha é a logo).
 */
export function Seta({ para }: { para: "anterior" | "proxima" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`seta-desenho seta-${para}`}>
      <path d="M10 2.5 L4.5 8 L10 13.5" />
    </svg>
  );
}
