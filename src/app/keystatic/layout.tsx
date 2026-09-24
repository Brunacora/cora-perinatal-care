import KeystaticApp from "./keystatic";

/**
 * O painel do The Cora Journal (`/keystatic`). Fica fora do `[locale]`: é ferramenta da Bruna, não
 * página do site, e tem o próprio `<html>`.
 *
 * NO AR, ele só abre quando existe onde gravar: o repositório no GitHub (`KEYSTATIC_GITHUB_REPO`).
 * Sem isso, o disco da Vercel é só de leitura, e um painel que parece salvar e perde o texto é pior
 * que um painel fechado.
 */
export const metadata = { title: "The Cora Journal, painel", robots: { index: false, follow: false } };

const podeAbrir = process.env.NODE_ENV !== "production" || Boolean(process.env.KEYSTATIC_GITHUB_REPO);

export default function Layout() {
  return (
    <html lang="pt-BR">
      <head />
      <body>
        {podeAbrir ? (
          <KeystaticApp />
        ) : (
          <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 560 }}>
            <h1>O painel ainda não está ligado</h1>
            <p>
              Ele abre depois que o site estiver no GitHub e a variável KEYSTATIC_GITHUB_REPO existir
              na Vercel.
            </p>
          </main>
        )}
      </body>
    </html>
  );
}
