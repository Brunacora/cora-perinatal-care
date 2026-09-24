/**
 * O DESTINO FIXO DO FORMULÁRIO (skill `sistema-de-formulario`).
 *
 * O destinatário mora AQUI, no código do servidor, e nunca vem do navegador: se viesse, qualquer
 * pessoa desviaria o formulário para outro endereço. Os outros dados alimentam o rodapé do e-mail
 * de confirmação, lidos daqui e não digitados à mão no molde.
 *
 * PENDENTE com a Bruna (pendencias-cora.md, "Acessos e contas"): confirmar que os pedidos caem
 * mesmo em welcome@.
 */
export const CONTATO = {
  destinatario: "welcome@coraperinatalcare.com",
  marca: "Cora Perinatal Care",
  dominio: "coraperinatalcare.com",
  site: "https://coraperinatalcare.com",
  instagram: "@coraperinatalcare",
  instagramUrl: "https://www.instagram.com/coraperinatalcare",
} as const;
