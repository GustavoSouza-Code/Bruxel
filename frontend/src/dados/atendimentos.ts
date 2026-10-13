import type { Atendimento } from "../tipos/atendimento";

/**
 * Atendimentos de exemplo, do mais novo pro mais antigo, pra a aba
 * "Atendimentos" do /perfil não abrir vazia.
 * TODO: trocar pelo GET de appointments do próprio cliente quando o backend tiver a rota.
 */
export const ATENDIMENTOS_EXEMPLO: Atendimento[] = [
  {
    id: "AT-2026-0002",
    tipo: "bomba-filtro",
    descricao: "A bomba faz um barulho alto quando liga e o filtro está perdendo pressão.",
    fotos: [],
    dataPreferida: "2026-10-16",
    periodo: "manha",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "agendado",
    criadoEm: "2026-10-08T14:35:00.000Z",
  },
  {
    id: "AT-2026-0001",
    tipo: "limpeza",
    descricao: "Limpeza completa antes do verão: a água está turva e com folhas no fundo.",
    fotos: [],
    dataPreferida: "2026-09-15",
    periodo: "tarde",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "concluido",
    criadoEm: "2026-09-10T10:00:00.000Z",
  },
];
