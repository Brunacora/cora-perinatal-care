"""Gera site/public/guia-do-painel/index.html: o guia de uma página do painel do journal, para a Bruna.
O traço do símbolo vem de src/components/ui/simbolo-traco-d.ts (a mesma fonte do sinal de fim)."""
import json, re, html

NBSP = chr(160)

RAIZ = str(__import__("pathlib").Path(__file__).resolve().parent.parent)
s = open(f"{RAIZ}/src/components/ui/simbolo-traco-d.ts", encoding="utf-8").read()
SIMB = json.loads(s[s.index("= {") + 2:].strip().rstrip(";"))
vb = " ".join(str(v) for v in SIMB["viewBox"])
tracos = "\n".join(
    f'<path d="{d}" pathLength="1" style="--i:{i}"/>' for i, d in enumerate(SIMB["tracos"])
)

def cola(t, teto=18):
    """Regra das órfãs, na apresentação: cola as TRÊS últimas palavras com espaço inflexível quando
    cabem no teto, senão as duas."""
    palavras = t.split(" ")
    for n in (3, 2):
        if len(palavras) > n and len(" ".join(palavras[-n:])) <= teto:
            return " ".join(palavras[:-n]) + " " + NBSP.join(palavras[-n:])
    return t

def p(t):
    """Texto com **negrito** vira <b>, depois cola o fim."""
    t = cola(t)
    t = html.escape(t, quote=False)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)

PAINEL = "https://cora-perinatal-care.vercel.app/keystatic"
ARCO = '<path d="M2 55 V21 A18 18 0 0 1 38 21 V55" pathLength="1"/>'

passos = [
    ("Entre", "Abra o painel e toque em **Log in with GitHub**, na conta **Brunacora**.", "botao"),
    ("Escreva", "Em **Artigos**, toque em **Add**. Preencha o título, o idioma, a categoria e os dois resumos. O texto vai no campo grande, logo abaixo. A capa se desenha sozinha.", None),
    ("Sublinhe", "Selecione a frase que você quer que a leitora guarde e toque em **Sublinhar à mão**. Uma por artigo fica mais bonito.", "sublinhado"),
    ("Publique", "Toque em **Create** num artigo novo, ou em **Save** num que você editou. Em uns dois minutos ele está no site.", None),
]

def extra(tipo):
    if tipo == "botao":
        return f'<a class="botao" href="{PAINEL}">Abrir o painel</a>'
    if tipo == "sublinhado":
        return (
            '<p class="demo" aria-hidden="true"><span class="demo-frase">'
            + p("Você não precisa dar conta de tudo sozinha.")
            + '</span><svg class="demo-onda"></svg></p>'
        )
    return ""

itens = "\n".join(
    f"""<li class="passo">
  <div class="passo-marca" aria-hidden="true">
    <svg viewBox="0 0 40 56">{ARCO}</svg><span>{i + 1:02d}</span>
  </div>
  <div class="passo-texto">
    <h2>{titulo}</h2>
    <p>{p(texto)}</p>
    {extra(tipo)}
  </div>
</li>"""
    for i, (titulo, texto, tipo) in enumerate(passos)
)

dicas = [
    "**Start here** troca o artigo em destaque, no topo do journal.",
    "Revisou um texto? Mude a **Última atualização** para hoje.",
    "Para tirar um artigo do ar, abra o artigo e use **Delete entry**, no menu de três pontinhos.",
    "Na dúvida sobre a caixa **Fala de saúde**, deixe ligada.",
]
lista_dicas = "\n".join(f"<li>{p(d)}</li>" for d in dicas)

HTML = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="only light">
<meta name="robots" content="noindex, nofollow">
<title>Guia do painel · The Cora Journal</title>
<link rel="icon" href="/logo/cora-simbolo-180.png">
<link rel="preload" href="/guia-do-painel/Gambetta-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/guia-do-painel/GeneralSans-Regular.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face {{ font-family: "Gambetta"; src: url(/guia-do-painel/Gambetta-Regular.woff2) format("woff2"); font-weight: 400; font-display: swap; }}
@font-face {{ font-family: "Gambetta"; src: url(/guia-do-painel/Gambetta-Italic.woff2) format("woff2"); font-weight: 400; font-style: italic; font-display: swap; }}
@font-face {{ font-family: "General Sans"; src: url(/guia-do-painel/GeneralSans-Regular.woff2) format("woff2"); font-weight: 400; font-display: swap; }}
@font-face {{ font-family: "General Sans"; src: url(/guia-do-painel/GeneralSans-Medium.woff2) format("woff2"); font-weight: 500; font-display: swap; }}

/* Tokens: os mesmos da marca (site/src/app/globals.css) */
:root {{
  color-scheme: only light;
  --cora-tinta: #d44d1b;       /* linha, desenho, título grande (3,96:1: nunca letra pequena) */
  --cora-tinta-funda: #b84217; /* fundo do botão: papel sobre ela, 5,04:1 */
  --cora-tinta-letra: #a53b13; /* letra pequena em tinta: 5,96:1 no papel */
  --cora-pessego: #fdd6b9;
  --cora-papel: #fdf5de;
  --cora-papel-2: #f7ecd2;
  --cora-barro: #3b2015;
  --cora-barro-70: #6b4a3c;
  --bg: var(--cora-papel);
  --text: var(--cora-barro);
  --muted: var(--cora-barro-70);
  --ink: var(--cora-tinta);
  --curva: cubic-bezier(0.16, 1, 0.3, 1);
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html {{ background: var(--bg); -webkit-text-size-adjust: 100%; }}
body {{
  background: var(--bg); color: var(--text);
  font: 400 1.0625rem/1.65 "General Sans", system-ui, sans-serif;
  padding: 0 20px env(safe-area-inset-bottom);
  overflow-x: clip;
}}
::selection {{ background: var(--cora-pessego); color: var(--cora-barro); }}
b {{ font-weight: 500; }}
p, li {{ text-wrap: pretty; }}
h1, h2 {{ font-family: "Gambetta", Georgia, serif; font-weight: 400; text-wrap: balance; }}
.folha {{ max-width: 34rem; margin: 0 auto; padding: 48px 0 40px; }}

/* Topo: o símbolo se desenha a uma tinta, e a borboleta chega e pousa no arco */
.topo {{ text-align: center; }}
.simbolo {{ position: relative; width: 88px; margin: 0 auto 28px; }}
.simbolo svg {{ display: block; width: 100%; height: auto; overflow: visible;
  fill: none; stroke: var(--ink); stroke-width: {SIMB["largura"]}; stroke-linecap: round; stroke-linejoin: round; }}
.simbolo path {{ stroke-dasharray: 1; stroke-dashoffset: 1;
  animation: tinta 0.9s var(--curva) forwards; animation-delay: calc(0.3s + var(--i) * 9ms); }}
@keyframes tinta {{ to {{ stroke-dashoffset: 0; }} }}

.voo {{ position: absolute; width: 60px; right: -30px; top: -20px;
  animation: chegar 3.4s cubic-bezier(0.33, 0.05, 0.2, 1) 1.2s both; }}
.asa {{ display: block; width: 100%; height: auto; transform-origin: 38% 70%;
  animation: bater-rapido 0.2s ease-in-out 1.2s 17 alternate, bater-lento 4.2s ease-in-out 4.8s infinite; }}
@keyframes chegar {{
  0%   {{ transform: translate(62vw, -14vh) rotate(-18deg) scale(0.7); opacity: 0; }}
  12%  {{ opacity: 1; }}
  45%  {{ transform: translate(26vw, 10vh) rotate(8deg) scale(0.9); }}
  75%  {{ transform: translate(-3vw, -4vh) rotate(-6deg) scale(1); }}
  100% {{ transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }}
}}
@keyframes bater-rapido {{ from {{ transform: scaleX(1); }} to {{ transform: scaleX(0.5); }} }}
@keyframes bater-lento {{
  0%, 64%, 100% {{ transform: scaleX(1); }}
  72% {{ transform: scaleX(0.6); }}
  80% {{ transform: scaleX(1); }}
  87% {{ transform: scaleX(0.72); }}
  94% {{ transform: scaleX(1); }}
}}

.marca {{ font: 500 0.8125rem/1 "General Sans", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cora-tinta-letra); }}
h1 {{ font-size: clamp(2.25rem, 1.6rem + 3vw, 3rem); line-height: 1.08; margin: 14px 0 16px; }}
h1 em {{ font-style: italic; color: var(--ink); }}
.lead {{ color: var(--muted); max-width: 26rem; margin: 0 auto; }}

/* Entrada de cada bloco, quando chega na tela */
.chega {{ opacity: 0; transform: translateY(18px); transition: opacity 0.7s var(--curva), transform 0.7s var(--curva); }}
.chega.visto {{ opacity: 1; transform: none; }}

/* Os passos: o número mora no ARCO da marca, que se desenha; uma linha costura os quatro */
.passos {{ list-style: none; margin: 56px 0 0; position: relative; }}
.passos::before {{ content: ""; position: absolute; left: 21px; top: 30px; bottom: 60px; width: 1.5px;
  background: var(--ink); transform-origin: top; transform: scaleY(var(--fio, 0)); opacity: 0.55; }}
.passo {{ display: grid; grid-template-columns: 44px 1fr; gap: 20px; padding-bottom: 40px; position: relative; }}
.passo-marca {{ position: relative; width: 44px; height: 60px; background: var(--bg); }}
.passo-marca svg {{ width: 44px; height: 60px; overflow: visible; fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; }}
.passo-marca path {{ stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.2s var(--curva) 0.15s; }}
.passo.visto .passo-marca path {{ stroke-dashoffset: 0; }}
.passo-marca span {{ position: absolute; inset: 20px 0 0; text-align: center; font: 400 1.125rem/1 "Gambetta", serif; color: var(--cora-tinta-letra);
  opacity: 0; transition: opacity 0.6s ease 0.7s; }}
.passo.visto .passo-marca span {{ opacity: 1; }}
.passo h2 {{ font-size: 1.625rem; line-height: 1.15; margin: 6px 0 8px; }}

.botao {{ display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 28px; margin-top: 18px;
  border-radius: 100px; background: var(--cora-tinta-funda); color: var(--cora-papel); font-weight: 500; text-decoration: none;
  transition: transform 200ms var(--curva), box-shadow 200ms var(--curva); }}
.botao:hover {{ transform: translateY(-2px); box-shadow: 0 8px 20px -10px rgb(184 66 23 / 0.6); }}
.botao:active {{ transform: scale(0.98); }}
.botao:focus-visible {{ outline: none; box-shadow: 0 0 0 3px var(--bg), 0 0 0 6px rgb(212 77 27 / 0.45); }}

/* A demonstração do sublinhado: a mesma onda de tinta do site, desenhando-se de novo e de novo */
.demo {{ position: relative; display: inline-block; margin-top: 18px; padding: 14px 18px 18px; border-radius: 16px;
  background: var(--cora-papel-2); font: italic 400 1.1875rem/1.35 "Gambetta", serif; }}
.demo-frase {{ position: relative; }}
.demo-onda {{ position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;
  fill: none; stroke: var(--ink); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }}
.demo-onda path {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}

/* As dicas: um cartão de papel, sem sombra, com o arco pequeno no canto */
.dicas {{ margin-top: 8px; padding: 26px 24px 24px; border-radius: 16px; background: var(--cora-papel-2); position: relative; }}
.dicas h2 {{ font-size: 1.375rem; margin-bottom: 12px; }}
.dicas ul {{ list-style: none; display: grid; gap: 10px; font-size: 0.9688rem; color: var(--muted); }}
.dicas li {{ padding-left: 20px; position: relative; }}
.dicas li::before {{ content: ""; position: absolute; left: 0; top: 0.62em; width: 8px; height: 10px; border: 1.5px solid var(--ink); border-bottom: 0; border-radius: 8px 8px 0 0; }}
.dicas b {{ color: var(--text); }}

/* O fecho: a linha da marca que vira arco, e a borboletinha pousada nele */
.fecho {{ text-align: center; margin-top: 56px; color: var(--muted); font-size: 0.9375rem; }}
.fecho-linha {{ position: relative; width: 120px; margin: 0 auto 18px; }}
.fecho-linha svg {{ width: 120px; height: 70px; overflow: visible; fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; }}
.fecho-linha path {{ stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.8s var(--curva); }}
.fecho.visto .fecho-linha path {{ stroke-dashoffset: 0; }}
.pouso {{ position: absolute; width: 40px; left: 72px; top: -22px; opacity: 0; transition: opacity 0.8s ease 1.2s;
  animation: flutuar 6s ease-in-out infinite; }}
.fecho.visto .pouso {{ opacity: 1; }}
.pouso img {{ display: block; width: 100%; height: auto; transform-origin: 40% 70%; animation: bater-lento 3.8s ease-in-out 2s infinite; }}
@keyframes flutuar {{ 0%, 100% {{ transform: translateY(0) rotate(0); }} 50% {{ transform: translateY(-5px) rotate(4deg); }} }}
.assinatura {{ margin-top: 6px; font-size: 0.8125rem; }}

@media (min-width: 768px) {{
  body {{ font-size: 1.125rem; }}
  .folha {{ padding-top: 80px; }}
  .simbolo {{ width: 104px; }}
  .voo {{ width: 72px; right: -38px; top: -26px; }}
}}

/* Movimento reduzido: tudo no estado final, parado */
@media (prefers-reduced-motion: reduce) {{
  *, *::before, *::after {{ animation: none !important; transition: none !important; }}
  .simbolo path, .passo-marca path, .demo-onda path, .fecho-linha path {{ stroke-dashoffset: 0 !important; }}
  .chega, .passo-marca span, .pouso {{ opacity: 1; transform: none; }}
  .passos::before {{ transform: none; }}
}}
</style>
</head>
<body>
<main class="folha">
  <header class="topo">
    <div class="simbolo">
      <svg viewBox="{vb}" aria-hidden="true">{tracos}</svg>
      <span class="voo" aria-hidden="true"><img class="asa" src="/guia-do-painel/borboleta-3.webp" width="240" height="247" alt=""></span>
    </div>
    <p class="marca">The Cora Journal</p>
    <h1>Seu caderno, <em>do seu jeito.</em></h1>
    <p class="lead">{p("Um guia de um minuto para escrever, editar e publicar no seu journal. Tudo o que você salva vai direto para o site.")}</p>
  </header>

  <ol class="passos">
{itens}
  </ol>

  <section class="dicas chega" aria-labelledby="dicas-titulo">
    <h2 id="dicas-titulo">Para ter à mão</h2>
    <ul>
{lista_dicas}
    </ul>
  </section>

  <footer class="fecho chega">
    <div class="fecho-linha" aria-hidden="true">
      <svg viewBox="0 0 120 70"><path d="M0 69 C 20 69 30 60 38 60 L 38 36 A 22 22 0 0 1 82 36 L 82 69 C 92 69 104 66 120 66" pathLength="1"/></svg>
      <span class="pouso"><img src="/guia-do-painel/borboleta-1.webp" width="160" height="166" alt=""></span>
    </div>
    <p>{p("Qualquer dúvida, é só chamar. A gente está do outro lado.")}</p>
    <p class="assinatura">Tá Online</p>
  </footer>
</main>
<script>
/* Cada bloco entra quando chega na tela; o fio que costura os passos cresce com a rolagem */
(() => {{
  const vistos = document.querySelectorAll(".passo, .chega");
  const io = new IntersectionObserver((es) => es.forEach((e) => {{
    if (e.isIntersecting) {{ e.target.classList.add("visto"); io.unobserve(e.target); }}
  }}), {{ rootMargin: "0px 0px -12% 0px" }});
  vistos.forEach((el) => io.observe(el));
  const lista = document.querySelector(".passos");
  let pedido = 0;
  const fio = () => {{
    pedido = 0;
    const r = lista.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
    lista.style.setProperty("--fio", p.toFixed(3));
  }};
  addEventListener("scroll", () => {{ if (!pedido) pedido = requestAnimationFrame(fio); }}, {{ passive: true }});
  fio();

  /* A DEMONSTRAÇÃO DO SUBLINHADO: um traço de caneta por linha real da frase (a mesma mecânica do
     site), desenhado em sequência, parado um instante, apagado, e de novo */
  const demo = document.querySelector(".demo"), frase = demo.querySelector(".demo-frase"), svg = demo.querySelector(".demo-onda");
  const NS = "http://www.w3.org/2000/svg";
  const onda = (x0, x1, y) => {{
    let d = `M ${{x0}} ${{y + 0.5}}`, x = x0, lado = 1;
    while (x < x1 - 1) {{
      const passo = Math.min(20, x1 - x);
      d += ` Q ${{x + passo / 2}} ${{y + 1.6 * lado}} ${{x + passo}} ${{x + passo >= x1 - 1 ? y - 1.4 : y}}`;
      x += passo; lado *= -1;
    }}
    return d;
  }};
  let linhas = [];
  const medir = () => {{
    const base = demo.getBoundingClientRect();
    const caixas = [...frase.getClientRects()].filter((r) => r.width > 2);
    svg.setAttribute("viewBox", `0 0 ${{base.width}} ${{base.height}}`);
    svg.replaceChildren();
    linhas = caixas.map((r) => {{
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", onda(r.left - base.left - 1, r.right - base.left + 2, r.bottom - base.top + 1));
      path.setAttribute("pathLength", "1");
      svg.appendChild(path);
      return {{ path, w: r.width }};
    }});
  }};
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const ciclo = async () => {{
    while (true) {{
      const atuais = linhas, total = atuais.reduce((s, l) => s + l.w, 0) || 1;
      for (const l of atuais) {{ l.path.style.opacity = 1; l.path.style.strokeDashoffset = 1; }}
      for (const l of atuais) {{
        await l.path.animate([{{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0 }}],
          {{ duration: 1500 * (l.w / total), easing: "cubic-bezier(0.4, 0, 0.3, 1)" }}).finished.catch(() => {{}});
        l.path.style.strokeDashoffset = 0;
      }}
      await espera(2600);
      await Promise.all(atuais.map((l) => l.path.animate([{{ opacity: 1 }}, {{ opacity: 0 }}], {{ duration: 500 }}).finished.catch(() => {{}})));
      for (const l of atuais) l.path.style.opacity = 0;
      await espera(500);
    }}
  }};
  document.fonts.ready.then(() => {{
    medir();
    new ResizeObserver(() => medir()).observe(demo);
    if (quieto) return;
    const olho = new IntersectionObserver((es) => {{ if (es[0].isIntersecting) {{ olho.disconnect(); ciclo(); }} }});
    olho.observe(demo);
  }});
}})();
</script>
</body>
</html>
"""
open(f"{RAIZ}/public/guia-do-painel/index.html", "w", encoding="utf-8").write(HTML)
print(len(HTML))
