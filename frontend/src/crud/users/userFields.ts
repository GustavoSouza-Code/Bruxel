import type { User } from "../../types/user";

/** Campos de texto que as telas deixam editar (id e perfil ficam de fora). */
export type EditableUserField = Exclude<keyof User, "id" | "perfil">;

// campos do endereço, na ordem dos inputs; o banco guarda cada um numa coluna
export const ADDRESS_FIELDS: { field: EditableUserField; label: string }[] = [
  { field: "rua", label: "Rua" },
  { field: "numero", label: "Número" },
  { field: "bairro", label: "Bairro" },
  { field: "cidade", label: "Cidade" },
  { field: "estado", label: "UF" },
  { field: "cep", label: "CEP" },
];

/**
 * Monta o endereço num texto só pra exibir, ex.: "Rua X, 850 - Centro, Lajeado - RS".
 * Pula as partes vazias; sem endereço nenhum devolve "".
 */
export function formatAddress(user: User) {
  const street = [user.rua, user.numero].filter(Boolean).join(", ");
  const city = [user.cidade, user.estado].filter(Boolean).join(" - ");
  return [street, user.bairro, city].filter(Boolean).join(" - ");
}
