import type { Usuario } from "../../types/usuario";

/** Campos de texto que as telas deixam editar (id e perfil ficam de fora). */
export type CampoEditavelUsuario = Exclude<keyof Usuario, "id" | "perfil">;

// campos do endereço, na ordem dos inputs; o banco guarda cada um numa coluna
export const CAMPOS_ENDERECO: { campo: CampoEditavelUsuario; label: string }[] = [
  { campo: "rua", label: "Rua" },
  { campo: "numero", label: "Número" },
  { campo: "bairro", label: "Bairro" },
  { campo: "cidade", label: "Cidade" },
  { campo: "estado", label: "UF" },
  { campo: "cep", label: "CEP" },
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
