/**
 * O FORMULÁRIO, NUMA LISTA SÓ (skill `sistema-de-formulario`; Passe 2, 2026-09-11).
 *
 * Esta lista é lida pelos DOIS lados: o formulário (`Form.tsx`) monta os controles a partir dela
 * e a rota (`app/api/pedido/route.ts`) valida a partir dela. Duas listas divergem, e quando
 * divergem é sempre o servidor que fica permissivo.
 *
 * AS CHAVES SÃO CONTRATO. Cada chave vira uma coluna da planilha, na ordem desta lista, entre
 * "Recebido em" (a primeira) e "Status" (a última). O Apps Script lê as mesmas chaves na mesma
 * ordem (`apps-script-pedidos.gs`, na raiz do projeto). Renomear ou reordenar uma chave aqui sem
 * mexer lá desalinha a planilha inteira, em silêncio, e o erro só aparece dias depois.
 *
 * O rótulo que a pessoa vê vem das mensagens (`footer.fields.<chave>`), copy verbatim do roteiro.
 * `coluna` é o nome curto da coluna na planilha e no e-mail interno da Bruna.
 */

export type Controle = "texto" | "tel" | "email" | "escolha" | "lista" | "area";

export type Campo = {
  chave: string;
  controle: Controle;
  coluna: string;
  /** limite de caracteres, conferido nos dois lados */
  max: number;
  /** a grade da folha: "par-cedo" emparelha desde o celular; "par" e "texto" a partir de 640px;
      "inteiro" nunca emparelha */
  largura: "par-cedo" | "par" | "texto" | "inteiro";
  obrigatorio?: boolean;
  /** os valores aceitos (escolha e lista), com o texto legível que vai para a planilha e para o
      e-mail da Bruna */
  opcoes?: Readonly<Record<string, string>>;
  padrao?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  /** formatação assistida enquanto a pessoa digita. Só "data" por enquanto: ver `mascaraData`
      em `Form.tsx`, que insere as barras SEM prender o campo a números. */
  mascara?: "data";
};

export const CAMPOS = [
  { chave: "name", controle: "texto", coluna: "Nome", max: 120, largura: "par-cedo", obrigatorio: true, autoComplete: "name" },
  { chave: "phone", controle: "tel", coluna: "Telefone", max: 40, largura: "par-cedo", autoComplete: "tel" },
  { chave: "email", controle: "email", coluna: "Email", max: 200, largura: "par", obrigatorio: true, autoComplete: "email" },
  {
    chave: "contact",
    controle: "escolha",
    coluna: "Contato preferido",
    max: 10,
    largura: "par",
    padrao: "email",
    opcoes: { email: "Email", phone: "Telefone" },
  },
  { chave: "location", controle: "texto", coluna: "Local", max: 200, largura: "par-cedo", autoComplete: "address-level2" },
  { chave: "date", controle: "texto", coluna: "Data prevista ou nascimento", max: 60, largura: "par-cedo", inputMode: "numeric", mascara: "data" },
  {
    chave: "services",
    controle: "lista",
    coluna: "Serviço",
    max: 20,
    largura: "inteiro",
    opcoes: {
      unsure: "Ainda não sabe que apoio precisa",
      inperson: "In Person Postpartum Support",
      classes: "Classes and Virtual Support",
      additional: "Additional Postpartum Care",
    },
  },
  { chave: "support", controle: "area", coluna: "Apoio que procura agora", max: 4000, largura: "texto" },
  { chave: "topics", controle: "area", coluna: "Temas, recursos e dicas", max: 4000, largura: "texto" },
  { chave: "three", controle: "area", coluna: "Três coisas para se preparar", max: 4000, largura: "texto" },
  { chave: "anything", controle: "area", coluna: "Algo mais antes da call", max: 4000, largura: "texto" },
] as const satisfies readonly Campo[];

export type ChaveCampo = (typeof CAMPOS)[number]["chave"];
export type Pedido = Record<ChaveCampo, string>;
export type Erro = "obrigatorio" | "email" | "telefone" | "longo" | "opcao";
export type Erros = Partial<Record<ChaveCampo, Erro>>;

/** os serviços que um botão de origem pode pré-selecionar (`?service=`, ver `destino.ts`) */
export const SERVICOS = ["inperson", "classes", "additional"] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const temOpcao = (opcoes: Readonly<Record<string, string>>, valor: string) =>
  Object.prototype.hasOwnProperty.call(opcoes, valor);

/** tira os espaços das pontas e descarta o que não é texto; toda chave da lista existe na saída */
export function normalizar(bruto: Record<string, unknown>): Pedido {
  const saida = {} as Pedido;
  for (const c of CAMPOS) {
    const v = bruto[c.chave];
    saida[c.chave] = typeof v === "string" ? v.trim() : "";
  }
  return saida;
}

export function validar(pedido: Pedido): Erros {
  const erros: Erros = {};
  for (const c of CAMPOS as readonly Campo[]) {
    const chave = c.chave as ChaveCampo;
    const v = pedido[chave] ?? "";
    if (v.length > c.max) erros[chave] = "longo";
    else if (c.obrigatorio && !v) erros[chave] = "obrigatorio";
    else if (v && c.opcoes && !temOpcao(c.opcoes, v)) erros[chave] = "opcao";
    else if (v && c.controle === "email" && !EMAIL.test(v)) erros[chave] = "email";
  }
  /* quem prefere ser procurada por telefone precisa deixar um telefone */
  if (pedido.contact === "phone" && !pedido.phone && !erros.phone) erros.phone = "telefone";
  return erros;
}

/** o texto legível de uma resposta, para a planilha e para o e-mail da Bruna */
export function legivel(campo: Campo, valor: string): string {
  return campo.opcoes && temOpcao(campo.opcoes, valor) ? campo.opcoes[valor] : valor;
}
