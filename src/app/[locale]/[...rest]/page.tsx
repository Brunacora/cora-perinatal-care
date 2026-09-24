import { notFound } from "next/navigation";

/* Qualquer endereço sem página dentro de um idioma cai aqui e vai para a 404 da marca
   ([locale]/not-found.tsx), dentro do layout do idioma. Padrão do next-intl. */
export default function EnderecoSemPagina() {
  notFound();
}
