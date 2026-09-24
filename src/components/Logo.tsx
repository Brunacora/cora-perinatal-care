import { LOGOS } from "./logos";

/**
 * A logo entra INLINE, porque é currentColor: herda a cor do contexto (tinta no
 * papel, papel na terracota). Sem leitura de disco: os caminhos são constantes.
 */
export function Logo({
  variante,
  altura,
  className = "",
  rotulo = "Cora Perinatal Care",
}: {
  variante: "simbolo" | "horizontal" | "vertical" | "wordmark" | "simbolo-quadrado";
  altura: number;
  className?: string;
  rotulo?: string;
}) {
  const { viewBox, inner } = LOGOS[variante];
  return (
    <span className={`logo inline-block ${className}`} style={{ height: altura, color: "var(--ink)" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        role="img"
        aria-label={rotulo}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    </span>
  );
}
