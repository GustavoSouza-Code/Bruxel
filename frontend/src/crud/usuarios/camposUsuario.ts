import type { Usuario } from "../../tipos/usuario";
import type { CamposAtualizacaoUsuario } from "../../api/usuarios";

/** Campos de texto que as telas deixam editar (id e perfil ficam de fora). */
export type CampoEditavelUsuario = Exclude<keyof Usuario, "id" | "perfil">;

/** Um campo de endereço como aparece no formulário de edição. */
interface CampoEndereco {
  campo: CampoEditavelUsuario;
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

/**
 * Monta o endereço num texto só pra exibir, ex.: "Rua X, 850 - Centro, Lajeado - RS".
 * Pula as partes vazias; sem endereço nenhum devolve "".
 */
export function formatarEndereco(usuario: Usuario) {
  const logradouro = [usuario.rua, usuario.numero].filter(Boolean).join(", ");
  const cidadeUf = [usuario.cidade, usuario.estado].filter(Boolean).join(" - ");
  return [logradouro, usuario.bairro, cidadeUf].filter(Boolean).join(" - ");
}

// texto vazio vira null: assim o PUT apaga o valor no banco em vez de gravar ""
function vazioParaNull(valor?: string | null) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

/**
 * Monta o corpo do PUT /users/:id a partir do usuário editado na tabela: só
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
