import { useState } from "react";
import type { User } from "../../types/user";
import type { SignupFormData } from "./SignupForm/SignupForm";

// Mock até o backend ter a rota de usuários pronta
const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    name: "Marcos Bruxel",
    email: "marcos@bruxelpiscinas.com",
    address: "Av. Benjamim Constant, 2361, Lajeado - RS",
    phone: "(51) 99307-8577",
    document: "123.456.789-00",
  },
  {
    id: "user-2",
    name: "Ana Paula Martins",
    email: "ana.paula@email.com",
    address: "Rua das Flores, 120, Lajeado - RS",
    phone: "(51) 99123-4567",
    document: "987.654.321-00",
  },
  {
    id: "user-3",
    name: "Eduardo Oliveira",
    email: "eduardo.oliveira@email.com",
    address: "Rua Sete de Setembro, 850, Lajeado - RS",
    phone: "(51) 99876-5432",
    document: "456.789.123-00",
  },
  {
    id: "user-4",
    name: "Luciana Hass",
    email: "luciana.hass@email.com",
    address: "Av. Presidente Vargas, 45, Lajeado - RS",
    phone: "(51) 99555-2211",
    document: "321.654.987-00",
  },
];

/**
 * CRUD de usuários: guarda a lista e é o único lugar que a altera. As telas
 * só chamam essas funções. A lista vive só na memória (começa com
 * INITIAL_USERS); quando o backend for integrado, as chamadas à API entram
 * aqui dentro sem precisar mexer nas páginas.
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  function createUser(data: SignupFormData) {
    const newUser: User = {
      // TODO: o id virá do backend; por enquanto usa a hora atual só pra ser único na sessão
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      // o formulário de cadastro não pede esses campos; o admin pode preencher depois em Editar
      address: "",
      phone: "",
      document: "",
    };
    // TODO: enviar data.password ao backend (POST /api/users); o User do front não guarda senha
    setUsers((current) => [...current, newUser]);
  }

  // substitui o usuário que tem o mesmo id pela versão editada
  function updateUser(updated: User) {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user))
    );
  }

  function deleteUser(id: string) {
    setUsers((current) => current.filter((user) => user.id !== id));
  }

  return { users, createUser, updateUser, deleteUser };
}
