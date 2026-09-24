import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { colarUltimasPalavras } from "@/lib/tipografia";

// Ponto único de carregamento da copy. É AQUI, e só aqui, que a apresentação
// aplica o espaço inflexível entre as duas últimas palavras de cada texto
// (regra de órfãs do CLAUDE.md). O arquivo de copy fica limpo.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: colarUltimasPalavras(messages),
  };
});
