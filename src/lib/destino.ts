// O destino único (roteiro.md, "O destino único"): todos os botões vão para o
// formulário, com o serviço pré-selecionado pela origem do clique.
export type Servico = "inperson" | "classes" | "additional";

export function destino(servico?: Servico) {
  return servico ? `?service=${servico}#form` : "#form";
}
