import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SITE_HOST } from "./lib/site";

const rotearIdioma = createMiddleware(routing);

/**
 * O roteamento de idioma é o trabalho principal daqui e passa primeiro, intocado. O que se
 * acrescenta é uma linha de SEO (skill `seo-e-medicao`).
 *
 * O `.vercel.app` responde 200 e serve o site inteiro, e toda URL de preview de deploy faz o mesmo:
 * sem aviso, viram cópia do domínio da Bruna no índice. Por isso a resposta sai com
 * `X-Robots-Tag: noindex, nofollow` em todo host da Vercel e, quando o domínio oficial existe
 * (`NEXT_PUBLIC_SITE_URL`), em qualquer host que não seja ele. O domínio oficial não recebe
 * cabeçalho nenhum e segue indexável.
 *
 * Por que não redirecionar o `.vercel.app` para o domínio: quebraria justamente o link que vai para
 * a Bruna aprovar e os previews de deploy. O `noindex` tira do índice sem tirar do ar.
 */
export default function proxy(request: NextRequest) {
  const resposta = rotearIdioma(request);

  /* `x-forwarded-host` é o que a borda da Vercel preenche com o domínio que a pessoa pediu;
     `host` é o caminho normal fora dela */
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();
  const naVercel = host.endsWith(".vercel.app");
  const foraDoOficial = SITE_HOST !== null && host !== "" && host !== SITE_HOST;
  if (naVercel || foraDoOficial) {
    resposta.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return resposta;
}

export const config = {
  /* `keystatic` é o painel do journal: fica fora do roteamento de idioma */
  matcher: "/((?!api|keystatic|trpc|_next|_vercel|.*\\..*).*)",
};
