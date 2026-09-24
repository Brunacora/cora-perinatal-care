/**
 * O objeto que o script do Umami pendura na janela (a estatística sem cookie, skill
 * `seo-e-medicao`).
 *
 * OPCIONAL DE PROPÓSITO (`umami?`): o tipo obriga quem chama a verificar se ele existe.
 * Bloqueador de anúncio removendo o script é o caso comum, não a exceção, e o formulário deste
 * site não pode depender de um objeto que pode não chegar. Declarado como obrigatório, o
 * TypeScript aprovaria `window.umami.track(...)`, que quebra justamente para quem usa bloqueador.
 *
 * Só `track` está declarado, porque é só ele que usamos.
 */
declare global {
  interface Window {
    umami?: {
      track: (evento: string, dados?: Record<string, unknown>) => void;
    };
  }
}

export {};
