import type { Atendimento } from "../../tipos/atendimento";

/**
 * Atendimento completo pros testes das regras da gestão: um pedido aguardando,
 * com a OS vazia. Cada teste troca só o que importa pra ele.
 */
export function atendimentoDeTeste(campos: Partial<Atendimento> = {}): Atendimento {
  return {
    id: "3f2a9c1b-0000-4000-8000-000000000003",
    tipo: "vazamento",
    descricao: "Está vazando água perto da escada.",
    fotoUrl: null,
    cliente: { id: "u1", nome: "Ana Souza" },
    abertoNaLoja: false,
    tecnico: null,
    data: "2026-10-21",
    horario: "13:30",
    contato: {
      telefone: "51998765432",
      rua: "Rua das Flores",
      numero: "120",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "aguardando",
    criadoEm: "2026-10-13T17:35:00.000Z",
    mensagemCliente: null,
    observacoesTecnico: "",
    produtosUsados: [],
    valorMaoDeObra: null,
    pagoEm: null,
    ...campos,
  };
}
