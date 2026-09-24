import { emailParaBruna, emailParaLead, escapar } from "@/lib/emails";
import type { Pedido } from "@/lib/formulario";

/**
 * A PROVA DOS DOIS E-MAILS (skill `sistema-de-formulario`, references/html-de-email.md).
 *
 * Renderiza as duas mensagens a partir do CÓDIGO REAL (`lib/emails.ts`), lado a lado, com uma
 * coluna a 375px, e com caracteres perigosos no nome para o escape ficar visível. Prova espelhada
 * à mão mente no dia em que o código muda.
 *
 * Só em desenvolvimento: em produção esta rota responde 404.
 */
const EXEMPLO: Pedido = {
  name: `Ana <b>Teste</b> & "Silva"`,
  phone: "(978) 555-0142",
  email: "ana.teste@example.com",
  contact: "phone",
  location: "Lowell, MA",
  date: "03/14/2027",
  services: "inperson",
  support: "Overnight help for the first weeks,\nand someone to talk feeding through with.",
  topics: "Sleep, bottle prep & pumping <basics>.",
  three: "Rest. A plan for meals. Knowing who to call.",
  anything: "",
};

/* o HTML do e-mail vai dentro de um atributo srcdoc */
const atributo = (html: string) => html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const bruna = emailParaBruna(EXEMPLO);
  const lead = emailParaLead(EXEMPLO, "en");

  const quadro = (rotulo: string, assunto: string, largura: number, html: string) => `
    <figure>
      <figcaption><strong>${rotulo}</strong> &middot; ${largura}px<br><span>Assunto: ${escapar(assunto)}</span></figcaption>
      <iframe title="${rotulo} a ${largura}px" width="${largura}" height="900" srcdoc="${atributo(html)}"
        onload="this.style.height=(this.contentDocument.documentElement.scrollHeight+4)+'px'"></iframe>
    </figure>`;

  const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Prova dos e-mails, Cora</title>
<style>
  body { margin: 0; padding: 24px; background: #d9d9d9; font: 13px/1.5 Arial, sans-serif; color: #222; }
  h1 { font-size: 16px; margin: 0 0 16px; }
  .linha { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  figure { margin: 0; }
  figcaption { margin-bottom: 8px; max-width: 640px; }
  iframe { display: block; border: 1px solid #999; background: #fff; }
  pre { background: #fff; border: 1px solid #999; padding: 12px; white-space: pre-wrap; max-width: 600px; }
</style>
</head>
<body>
<h1>Prova dos dois e-mails, gerada do código real (src/lib/emails.ts)</h1>
<div class="linha">
  ${quadro("Para a Bruna", bruna.assunto, 375, bruna.html)}
  ${quadro("Para o lead", lead.assunto, 375, lead.html)}
</div>
<div class="linha" style="margin-top:32px">
  ${quadro("Para a Bruna", bruna.assunto, 640, bruna.html)}
  ${quadro("Para o lead", lead.assunto, 640, lead.html)}
</div>
<h1 style="margin-top:32px">Versão em texto puro</h1>
<div class="linha"><pre>${escapar(bruna.texto)}</pre><pre>${escapar(lead.texto)}</pre></div>
</body>
</html>`;

  return new Response(pagina, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
