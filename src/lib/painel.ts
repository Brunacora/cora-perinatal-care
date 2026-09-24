/**
 * O painel do journal (Keystatic) só abre quando tem onde gravar (2026-09-23).
 *
 * No computador, sempre (sem as chaves ele mostra o assistente que cria o app do GitHub). No AR, só
 * com as três chaves do app. Sem elas, criar a API do Keystatic derruba o BUILD inteiro ("Missing
 * required config"): a ordem de cadastrar as variáveis na Vercel não pode quebrar o site.
 */
export const PAINEL_LIGADO =
  process.env.NODE_ENV !== "production" ||
  Boolean(
    process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
      process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
      process.env.KEYSTATIC_SECRET,
  );
