import { routing } from "@/i18n/routing";

/** O endereço do guia de serviços em cada idioma: o inglês na raiz, o português em "/pt". */
export const CAMINHO_DO_GUIA = "/services-guide";

export function enderecoDoGuia(locale: string): string {
  return locale === routing.defaultLocale ? CAMINHO_DO_GUIA : `/${locale}${CAMINHO_DO_GUIA}`;
}
