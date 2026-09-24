"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WarningCircle } from "@phosphor-icons/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAMPOS, SERVICOS, normalizar, validar, type Campo, type ChaveCampo, type Erro, type Erros } from "@/lib/formulario";

type Estado = "editando" | "enviando" | "enviado" | "falhou";

const CURVA = [0.16, 1, 0.3, 1] as const;

function lerServicoDaUrl() {
  const p = new URLSearchParams(window.location.search).get("service");
  return (SERVICOS as readonly string[]).includes(p ?? "") ? (p as string) : "";
}

/* "cora:destino" é o aviso do MovimentoProvider quando um botão de serviço troca o endereço sem
   recarregar a página (pushState não dispara popstate) */
function assinar(aoMudar: () => void) {
  window.addEventListener("hashchange", aoMudar);
  window.addEventListener("popstate", aoMudar);
  window.addEventListener("cora:destino", aoMudar);
  return () => {
    window.removeEventListener("hashchange", aoMudar);
    window.removeEventListener("popstate", aoMudar);
    window.removeEventListener("cora:destino", aoMudar);
  };
}

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? "";

/**
 * A MÁSCARA DA DATA (pedido da Bruna, 2026-09-23). Ela recebeu um pedido em que a data chegou como
 * "10052027", sem separador, e pediu que o campo mostrasse 05/05/2026.
 *
 * A regra é DELIBERADAMENTE frouxa: só formata quando o que está ali são dígitos e barras. O campo
 * pergunta "data prevista OU nascimento do bebê", e muita gente ainda não sabe: quem escrever
 * "early May" ou "não sei ainda" passa intacto, porque prender o campo a número transformaria uma
 * pergunta acolhedora num formulário que recusa a resposta honesta.
 */
function mascaraData(valor: string) {
  if (!/^[\d/]*$/.test(valor)) return valor;
  const d = valor.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * O EVENTO DA CONVERSÃO (skill `seo-e-medicao`): visita não é resultado, pedido é. Dispara só depois
 * de a rota CONFIRMAR o envio, nunca no clique do botão. E o envio nunca depende da estatística: sem
 * o script (bloqueador de anúncio, rede lenta), `umami` não existe e nada acontece; se ele existir e
 * falhar, o erro morre aqui.
 */
const EVENTO_CONVERSAO = "pedido-enviado";
function registrarConversao() {
  try {
    window.umami?.track(EVENTO_CONVERSAO);
  } catch {
    /* a estatística nunca derruba o agradecimento */
  }
}

/**
 * O DESTINO ÚNICO (seção 13; Passe 2, 2026-09-11).
 *
 * Os onze campos do roteiro saem da lista única de `lib/formulario.ts`, a mesma que a rota usa
 * para validar. Rótulo acima, linha inferior que se desenha no foco, ids com prefixo "form-" (não
 * colidem com as âncoras do site). O serviço chega pré-selecionado pelo parâmetro do botão de
 * origem; o select remonta quando a origem muda e continua livre para a pessoa trocar.
 *
 * O Passe 0 escolheu o Multi-Field Form (21st.dev 25085) para dentro da folha. Aberto no código no
 * Passe 2, ele NÃO entrou: sete dependências (react-hook-form, Radix Select e Checkbox, cva,
 * lucide, slot) para desenhar o que o formulário nativo já fazia, e um select em portal do Radix,
 * pior no celular que o nativo. Entrou o PADRÃO dele, escrito aqui: o erro na linha do próprio
 * campo e o botão com estado de envio.
 *
 * Validação só depois da primeira tentativa de envio (ninguém leva bronca enquanto digita); dali
 * em diante ela acompanha a digitação e o erro some assim que o campo fica certo. O foco vai para
 * o primeiro campo com problema. O erro é texto em barro, com ícone e linha em tinta: nunca só cor,
 * e nunca texto pequeno em tinta (tinta sobre papel mede 3,96:1, abaixo da régua do corpo).
 *
 * Proteção contra robô sem CAPTCHA, que quebraria o respiro: a armadilha escondida e o tempo desde
 * que o formulário montou. Quem decide é a rota.
 *
 * Posse do movimento: Motion (a troca do formulário pelo agradecimento). A folha que sobe é da cena
 * do rodapé, em GSAP, e nunca encosta nos campos.
 */
export function Form() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const reduzido = useReducedMotion();
  const daUrl = useSyncExternalStore(assinar, lerServicoDaUrl, () => "");
  const [estado, setEstado] = useState<Estado>("editando");
  const [erros, setErros] = useState<Erros>({});
  const [tentou, setTentou] = useState(false);
  const [nome, setNome] = useState("");
  const montadoEm = useRef(0);

  useEffect(() => {
    montadoEm.current = performance.now();
  }, []);

  const transicao = { duration: reduzido ? 0 : 0.45, ease: CURVA };

  const rotuloOpcao = (chave: ChaveCampo, valor: string) =>
    chave === "contact"
      ? t(valor === "phone" ? "fields.contactPhone" : "fields.contactEmail")
      : t(`fields.servicesOptions.${valor}`);

  const mensagem = (chave: ChaveCampo, erro: Erro) => {
    if (erro === "obrigatorio") return t(chave === "email" ? "form.errors.email" : "form.errors.name");
    if (erro === "email") return t("form.errors.emailInvalid");
    if (erro === "telefone") return t("form.errors.phone");
    return t("form.errors.check");
  };

  const ler = (form: HTMLFormElement) => normalizar(Object.fromEntries(new FormData(form)));

  const revalidar = (e: FormEvent<HTMLFormElement>) => setErros(validar(ler(e.currentTarget)));

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === "enviando") return;
    const form = e.currentTarget;
    const pedido = ler(form);
    const achados = validar(pedido);
    setTentou(true);
    setErros(achados);

    const primeiro = CAMPOS.find((c) => achados[c.chave]);
    if (primeiro) {
      const alvo =
        document.getElementById(`form-${primeiro.chave}`) ??
        form.querySelector<HTMLInputElement>(`[name="${primeiro.chave}"]:checked`);
      alvo?.focus();
      return;
    }

    setEstado("enviando");
    try {
      const resposta = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pedido,
          website: String(new FormData(form).get("website") ?? ""),
          decorrido: Math.round(performance.now() - montadoEm.current),
          locale,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { ok?: boolean };
      if (resposta.ok && corpo.ok) {
        setNome(primeiroNome(pedido.name));
        setEstado("enviado");
        registrarConversao();
      } else {
        setEstado("falhou");
      }
    } catch {
      setEstado("falhou");
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {estado === "enviado" ? (
        <motion.div
          key="obrigado"
          className="formulario-obrigado"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transicao}
        >
          <Agradecimento titulo={t("form.success.title", { name: nome })} texto={t("form.success.text")} />
        </motion.div>
      ) : (
        <motion.form
          key="formulario"
          className="formulario"
          action="/api/pedido"
          method="post"
          noValidate
          onSubmit={enviar}
          onChange={tentou ? revalidar : undefined}
          exit={{ opacity: 0, y: -8 }}
          transition={transicao}
        >
          {CAMPOS.map((item) => {
            const c: Campo = item;
            const chave = item.chave;
            const id = `form-${chave}`;
            const erro = erros[chave];
            const idErro = `${id}-erro`;
            const classe = `campo campo-${c.largura}`;
            const invalido = erro ? true : undefined;
            const descrito = erro ? idErro : undefined;
            const aviso = erro ? (
              <p id={idErro} className="campo-erro">
                <WarningCircle aria-hidden="true" size={16} weight="light" />
                <span>{mensagem(chave, erro)}</span>
              </p>
            ) : null;

            if (c.controle === "escolha") {
              return (
                <fieldset key={chave} className={classe} data-erro={erro ? "true" : undefined}>
                  <legend className="campo-legenda">{t(`fields.${chave}`)}</legend>
                  <div className="campo-opcoes">
                    {Object.keys(c.opcoes ?? {}).map((valor) => (
                      <label key={valor} className="campo-opcao">
                        <input type="radio" name={chave} value={valor} defaultChecked={valor === c.padrao} />
                        <span>{rotuloOpcao(chave, valor)}</span>
                      </label>
                    ))}
                  </div>
                  {aviso}
                </fieldset>
              );
            }

            let controle: ReactNode;
            if (c.controle === "lista") {
              controle = (
                <select
                  id={id}
                  name={chave}
                  key={daUrl}
                  defaultValue={chave === "services" ? daUrl : ""}
                  aria-invalid={invalido}
                  aria-describedby={descrito}
                >
                  <option value="" />
                  {Object.keys(c.opcoes ?? {}).map((valor) => (
                    <option key={valor} value={valor}>
                      {rotuloOpcao(chave, valor)}
                    </option>
                  ))}
                </select>
              );
            } else if (c.controle === "area") {
              controle = (
                <textarea
                  id={id}
                  name={chave}
                  rows={2}
                  maxLength={c.max}
                  aria-invalid={invalido}
                  aria-describedby={descrito}
                />
              );
            } else {
              controle = (
                <input
                  id={id}
                  name={chave}
                  type={c.controle === "texto" ? "text" : c.controle}
                  autoComplete={c.autoComplete}
                  inputMode={c.inputMode}
                  maxLength={c.max}
                  required={c.obrigatorio}
                  placeholder={c.mascara === "data" ? t("fields.datePlaceholder") : undefined}
                  aria-invalid={invalido}
                  aria-describedby={descrito}
                  /* SÓ FORMATA COM O CURSOR NO FIM. Reescrever o valor enquanto alguém corrige o
                     meio do texto joga o cursor para o fim a cada tecla, que é o defeito clássico
                     de máscara feita à pressa. */
                  onInput={
                    c.mascara === "data"
                      ? (e) => {
                          const el = e.currentTarget;
                          if (el.selectionStart !== el.value.length) return;
                          const formatado = mascaraData(el.value);
                          if (formatado !== el.value) el.value = formatado;
                        }
                      : undefined
                  }
                />
              );
            }

            return (
              <div key={chave} className={classe} data-erro={erro ? "true" : undefined}>
                <label htmlFor={id}>{t(`fields.${chave}`)}</label>
                <span className="campo-controle">{controle}</span>
                {aviso}
              </div>
            );
          })}

          {/* a armadilha: fora da tela e fora da árvore de acessibilidade. Gente não vê, robô preenche. */}
          <div className="formulario-armadilha" aria-hidden="true">
            <label htmlFor="form-website">Website</label>
            <input id="form-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {/* o texto troca ao enviar e a pílula não cresce nem pisca: os dois rótulos dividem a
              mesma célula, e a largura é sempre a do mais longo */}
          <button
            type="submit"
            className="botao formulario-envio"
            data-estado={estado}
            aria-disabled={estado === "enviando" ? true : undefined}
          >
            <span className="envio-rotulos">
              <span className="envio-rotulo" aria-hidden={estado === "enviando" ? true : undefined}>
                {t("cta")}
              </span>
              <span className="envio-rotulo" aria-hidden={estado === "enviando" ? undefined : true}>
                {t("form.sending")}
              </span>
            </span>
          </button>

          {/* a falha: o pedido não saiu. A saída de emergência é o e-mail e o telefone dela. */}
          {estado === "falhou" ? (
            <div className="formulario-falha" role="alert">
              <p>{t("form.failure")}</p>
              <p className="formulario-falha-saidas">
                <a className="link-linha" href={`mailto:${t("contact.emailAddress")}`}>
                  {t("contact.email")}
                </a>
                <a className="link-linha" href={`tel:${t("contact.phoneNumber")}`}>
                  {t("contact.phone")}
                </a>
              </p>
            </div>
          ) : null}

          <p className="texto-apoio">{t("micro1")}</p>
          <p className="texto-apoio">{t("micro2")}</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/**
 * O agradecimento recebe o foco ao aparecer: o leitor de tela anuncia, e ele entra na tela.
 * E a folha encolheu (o formulário virou um parágrafo), então as cenas do rodapé remedem AQUI, com
 * o agradecimento já no lugar. Medido: remedir na saída do formulário pegava a folha vazia, no meio
 * da troca, e o símbolo ficava apagado no vão que sobrava.
 */
function Agradecimento({ titulo, texto }: { titulo: string; texto: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    const quadro = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(quadro);
  }, []);
  return (
    <>
      <h3 ref={ref} tabIndex={-1} className="formulario-obrigado-titulo">
        {titulo}
      </h3>
      <p className="corpo-grande">{texto}</p>
    </>
  );
}
