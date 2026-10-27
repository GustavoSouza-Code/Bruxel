import type { Usuario } from "../../tipos/usuario";
import type { CamposAtualizacaoUsuario } from "../../api/usuarios";

/** Campos de texto que as telas deixam editar (id e perfil ficam de fora). */
export type CampoEditavelUsuario = Exclude<keyof Usuario, "id" | "perfil">;

/** Partes do endereço: cada uma é uma coluna da tabela users (e um campo do ContatoAtendimento). */
export type ParteEndereco = "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep";

/** Um campo de endereço como aparece no formulário de edição. */
interface CampoEndereco {
  campo: ParteEndereco;
  label: string;
  /** limite do input; sem normalizar, é o tamanho da coluna no banco (acima disso o PostgreSQL recusa) */
  maxLength: number;
  /** ajusta o texto digitado antes de guardar (ex.: CEP só com dígitos) */
  normalizar?: (valor: string) => string;
}

// campos do endereço, na ordem dos inputs; o banco guarda cada um numa coluna
export const CAMPOS_ENDERECO: CampoEndereco[] = [
  { campo: "rua", label: "Rua", maxLength: 150 },
  { campo: "numero", label: "Número", maxLength: 10 },
  { campo: "bairro", label: "Bairro", maxLength: 80 },
  { campo: "cidade", label: "Cidade", maxLength: 80 },
  {
    campo: "estado",
    label: "UF",
    maxLength: 2,
    normalizar: (valor) => valor.replace(/[^a-zA-Z]/g, "").toUpperCase(),
  },
  // o input aceita 9 caracteres pra caber o hífen ao colar "95900-000"; o normalizar
  // tira o hífen e corta em 8 dígitos (o tamanho da coluna)
  {
    campo: "cep",
    label: "CEP",
    maxLength: 9,
    normalizar: (valor) => valor.replace(/\D/g, "").slice(0, 8),
  },
];

/** Uma mensagem por campo com formato errado; objeto vazio = UF e CEP ok. */
export type ErrosUfCep = Partial<Record<"estado" | "cep", string>>;

/**
 * UF e CEP são opcionais, mas preenchidos precisam do formato que o banco aceita
 * (CHAR(2) e CHECK de 8 dígitos); sem isso o backend responde 500.
 */
export function validarUfCep({ estado, cep }: { estado?: string | null; cep?: string | null }): ErrosUfCep {
  const erros: ErrosUfCep = {};
  // só espaços conta como vazio (vira null no banco)
  const uf = estado?.trim();
  const digitosCep = cep?.trim();
  if (uf && !/^[A-Za-z]{2}$/.test(uf)) {
    erros.estado = "A UF deve ter 2 letras (ex.: RS).";
  }
  if (digitosCep && digitosCep.replace(/\D/g, "").length !== 8) {
    erros.cep = "O CEP deve ter 8 dígitos.";
  }
  return erros;
}

/**
 * Monta o endereço (do usuário ou de um atendimento) num texto só pra exibir, ex.: "Rua X, 850 - Centro, Lajeado - RS".
 * Pula as partes vazias; sem endereço nenhum devolve "".
 */
export function formatarEndereco(endereco: Pick<Usuario, Exclude<ParteEndereco, "cep">>) {
  const logradouro = [endereco.rua, endereco.numero].filter(Boolean).join(", ");
  const cidadeUf = [endereco.cidade, endereco.estado].filter(Boolean).join(" - ");
  return [logradouro, endereco.bairro, cidadeUf].filter(Boolean).join(" - ");
}

/**
 * Versão de uma mensagem só do validarUfCep, pros formulários que mostram um
 * erro geral. Devolve a mensagem do primeiro problema (CEP antes da UF), ou null.
 */
export function validarEndereco(endereco: Pick<Usuario, "estado" | "cep">): string | null {
  const erros = validarUfCep(endereco);
  return erros.cep ?? erros.estado ?? null;
}

// texto vazio vira null: assim o PUT apaga o valor no banco em vez de gravar ""
function vazioParaNull(valor?: string | null) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

/**
 * Monta o corpo do PUT /users/:id a partir do usuário editado no formulário: só
 * os campos que o backend aceita (CPF, id e perfil ficam de fora).
 */
export function paraCamposAtualizacao(usuario: Usuario): CamposAtualizacaoUsuario {
  return {
    nome: usuario.nome.trim(),
    email: usuario.email.trim(),
    telefone: vazioParaNull(usuario.telefone),
    rua: vazioParaNull(usuario.rua),
    numero: vazioParaNull(usuario.numero),
    bairro: vazioParaNull(usuario.bairro),
    cidade: vazioParaNull(usuario.cidade),
    estado: vazioParaNull(usuario.estado),
    cep: vazioParaNull(usuario.cep),
  };
}
