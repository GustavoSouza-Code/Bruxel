import { useState } from "react";
import type { User } from "../../types/user";
import type { SignupFormData } from "./SignupForm/SignupForm";

// Mock até o backend ter a rota de usuários pronta
const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    nome: "Marcos Bruxel",
    email: "marcos@bruxelpiscinas.com",
    cpf: "12345678900",
    telefone: "(51) 99307-8577",
    rua: "Av. Benjamim Constant",
    numero: "2361",
    cidade: "Lajeado",
    estado: "RS",
    perfil: "ADMINISTRADOR",
  },
  {
    id: "user-2",
    nome: "Ana Paula Martins",
    email: "ana.paula@email.com",
    cpf: "98765432100",
    telefone: "(51) 99123-4567",
    rua: "Rua das Flores",
    numero: "120",
    cidade: "Lajeado",
    estado: "RS",
    perfil: "CLIENTE",
  },
  {
    id: "user-3",
    nome: "Eduardo Oliveira",
    email: "eduardo.oliveira@email.com",
    cpf: "45678912300",
    telefone: "(51) 99876-5432",
    rua: "Rua Sete de Setembro",
    numero: "850",
    cidade: "Lajeado",
    estado: "RS",
    perfil: "CLIENTE",
  },
  {
    id: "user-4",
    nome: "Luciana Hass",
    email: "luciana.hass@email.com",
    cpf: "32165498700",
    telefone: "(51) 99555-2211",
    rua: "Av. Presidente Vargas",
    numero: "45",
    cidade: "Lajeado",
    estado: "RS",
    perfil: "CLIENTE",
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
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      // o banco já cria todo usuário como CLIENTE; o endereço o admin preenche depois em Editar
      perfil: "CLIENTE",
    };
    // TODO: enviar data.senha ao backend (POST /api/users); o User do front não guarda senha
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
