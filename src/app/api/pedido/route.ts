import { CAMPOS, legivel, normalizar, validar, type Campo, type ChaveCampo, type Pedido } from "@/lib/formulario";
import { CONTATO } from "@/lib/contato";
import { emailParaBruna, emailParaLead } from "@/lib/emails";

/**
 * O DESTINO DO FORMULÁRIO (skill `sistema-de-formulario`; Passe 2, 2026-09-11).
 *
 * O pedido vai para mais de um lugar, nesta ordem, e a ordem é a proteção:
 *   1. a planilha do Google (Apps Script), o registro durável;
 *   2. o e-mail para a Bruna, com Reply-To do lead;
 *   3. o e-mail de confirmação para o lead, com Reply-To da Bruna.
 *
 * A REGRA DE SUCESSO: sucesso = a planilha gravou OU o e-mail da Bruna saiu. Erro = os dois
 * falharam. A confirmação do lead falhar NUNCA é erro: mostrar erro depois que a planilha gravou
 * faz a pessoa reenviar, e reenviar duplica a linha.
 *
 * Toda chamada deixa UMA linha no log dizendo qual destino caiu, e o código com o corpo da
 * resposta do provedor quando algo falha. É essa linha que transforma "o e-mail não chegou" num
 * diagnóstico de trinta segundos (Vercel > Logs, filtro "[pedido]"). Nada de dado pessoal do lead
 * no log, e nunca a chave nem o token.
 *
 * As quatro variáveis moram só na Vercel (produção) e no .env.local (máquina local), nunca no
 * código: SHEET_WEBHOOK_URL, SHEET_TOKEN, RESEND_API_KEY, QUOTE_FROM. Variável nova ou trocada só
 * vale depois de um deploy NOVO.
 */

/** piso de tempo, e SÓ piso. Nunca teto: um teto barrava gente real que abre o formulário, vai
    buscar a data, atende o telefone e volta no dia seguinte com a aba aberta. */
const PISO_MS = 4000;
const JANELA_MS = 10 * 60 * 1000;
const LIMITE_POR_JANELA = 5;
/** o Apps Script é lento em dia ruim; passou disso, segue sem esperar */
const TEMPO_LIMITE_MS = 8000;

type Resultado = { ok: true } | { ok: false; detalhe: string };

/* O freio por IP: cinco envios a cada dez minutos. Mora na memória da instância, então não é um
   muro, é um freio: impede que uma rajada vire uma rajada de e-mail na caixa da Bruna. */
const envios = new Map<string, number[]>();

function freado(ip: string): boolean {
  const agora = Date.now();
  const recentes = (envios.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE_POR_JANELA) {
    envios.set(ip, recentes);
    return true;
  }
  recentes.push(agora);
  envios.set(ip, recentes);
  if (envios.size > 5000) envios.clear();
  return false;
}

function ipDe(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || request.headers.get("x-real-ip") || "desconhecido";
}

/** Robô detectado recebe 200, não 4xx: um erro ensina o robô a tentar de novo. */
function robo(motivo: string): Response {
  console.log(`[pedido] robo=${motivo}`);
  return Response.json({ ok: true });
}

const explicar = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

async function gravarNaPlanilha(pedido: Pedido): Promise<Resultado> {
  const url = process.env.SHEET_WEBHOOK_URL?.trim();
  const token = process.env.SHEET_TOKEN?.trim();
  if (!url || !token) return { ok: false, detalhe: "SHEET_WEBHOOK_URL ou SHEET_TOKEN ausente neste ambiente" };

  /* a linha, com as chaves do contrato e o texto legível das escolhas */
  const linha: Record<string, string> = {};
  for (const c of CAMPOS as readonly Campo[]) linha[c.chave] = legivel(c, pedido[c.chave as ChaveCampo]);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...linha }),
      /* o Apps Script responde 302 para um endereço do googleusercontent. Quem não segue o
         redirecionamento conclui que falhou TENDO gravado. É o padrão, e fica escrito. */
      redirect: "follow",
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
    const texto = await r.text();
    let resposta: { ok?: boolean } = {};
    try {
      resposta = JSON.parse(texto) as { ok?: boolean };
    } catch {
      /* resposta que não é JSON é falha, e o corpo vai para o log */
    }
    return resposta.ok === true ? { ok: true } : { ok: false, detalhe: `${r.status} ${texto.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, detalhe: explicar(e) };
  }
}

async function enviarEmail(mensagem: {
  para: string;
  responderPara: string;
  assunto: string;
  html: string;
  texto: string;
}): Promise<Resultado> {
  /* .trim(): chave colada com espaço na frente derruba a autenticação com 401 e nenhuma pista */
  const chave = process.env.RESEND_API_KEY?.trim();
  const de = process.env.QUOTE_FROM?.trim();
  if (!chave || !de) return { ok: false, detalhe: "RESEND_API_KEY ou QUOTE_FROM ausente neste ambiente" };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: de,
        to: [mensagem.para],
        reply_to: mensagem.responderPara,
        subject: mensagem.assunto,
        html: mensagem.html,
        text: mensagem.texto,
      }),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
    if (r.ok) return { ok: true };
    return { ok: false, detalhe: `${r.status} ${(await r.text()).slice(0, 300)}` };
  } catch (e) {
    return { ok: false, detalhe: explicar(e) };
  }
}

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    const texto = await request.text();
    if (texto.length > 60_000) return robo("corpo grande demais");
    const lido: unknown = JSON.parse(texto);
    if (!lido || typeof lido !== "object" || Array.isArray(lido)) return robo("corpo que nao e objeto");
    corpo = lido as Record<string, unknown>;
  } catch {
    return robo("corpo ilegivel");
  }

  /* 1. a armadilha: um campo escondido que só robô preenche */
  if (typeof corpo.website === "string" && corpo.website.trim() !== "") return robo("armadilha");

  /* 2. o piso de tempo, medido pelo navegador desde que o formulário montou */
  const decorrido = typeof corpo.decorrido === "number" ? corpo.decorrido : Number.NaN;
  if (!Number.isFinite(decorrido) || decorrido < PISO_MS) return robo("rapido demais");

  /* 3. o freio por IP */
  if (freado(ipDe(request))) return robo("freio de ip");

  /* 4. a validação, pela MESMA lista que monta o formulário */
  const pedido = normalizar(corpo);
  const erros = validar(pedido);
  if (Object.keys(erros).length > 0) return Response.json({ ok: false, erros }, { status: 400 });

  const locale = corpo.locale === "pt" ? "pt" : "en";

  /* 5. a planilha primeiro: é o registro durável */
  const planilha = await gravarNaPlanilha(pedido);

  /* 6. os dois e-mails, com o Reply-To cruzado: a Bruna aperta responder e cai no lead; o lead
     aperta responder e cai na Bruna */
  const [cliente, lead] = await Promise.all([
    enviarEmail({ para: CONTATO.destinatario, responderPara: pedido.email, ...emailParaBruna(pedido) }),
    enviarEmail({ para: pedido.email, responderPara: CONTATO.destinatario, ...emailParaLead(pedido, locale) }),
  ]);

  const marca = (r: Resultado) => (r.ok ? "ok" : "FALHOU");
  console.log(`[pedido] planilha=${marca(planilha)} cliente=${marca(cliente)} lead=${marca(lead)}`);
  if (!planilha.ok) console.log(`[pedido] planilha: ${planilha.detalhe}`);
  if (!cliente.ok) console.log(`[pedido] cliente: ${cliente.detalhe}`);
  if (!lead.ok) console.log(`[pedido] lead: ${lead.detalhe}`);

  /* A REGRA DE SUCESSO */
  const sucesso = planilha.ok || cliente.ok;
  return Response.json({ ok: sucesso }, { status: sucesso ? 200 : 502 });
}
