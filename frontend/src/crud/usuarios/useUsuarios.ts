import { useState } from "react";
import type { Usuario } from "../../types/usuario";
import type { DadosFormularioCadastro } from "./FormularioCadastro/FormularioCadastro";

// Mock até o backend ter a rota de usuários pronta
const USUARIOS_INICIAIS: Usuario[] = [
  {
    id: "usuario-1",
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
    id: "usuario-2",
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
    id: "usuario-3",
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
    id: "usuario-4",
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
 * USUARIOS_INICIAIS); quando o backend for integrado, as chamadas à API entram
 * aqui dentro sem precisar mexer nas páginas.
 */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INICIAIS);

  function criarUsuario(dados: DadosFormularioCadastro) {
    const novoUsuario: Usuario = {
      // TODO: o id virá do backend; por enquanto usa a hora atual só pra ser único na sessão
      id: `usuario-${Date.now()}`,
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      // o banco já cria todo usuário como CLIENTE; o endereço o admin preenche depois em Editar
      perfil: "CLIENTE",
    };
    // TODO: enviar dados.senha ao backend (POST /api/users); o Usuario do front não guarda senha
    setUsuarios((atuais) => [...atuais, novoUsuario]);
  }

  // substitui o usuário que tem o mesmo id pela versão editada
  function atualizarUsuario(atualizado: Usuario) {
    setUsuarios((atuais) =>
      atuais.map((usuario) => (usuario.id === atualizado.id ? atualizado : usuario))
    );
  }

  function excluirUsuario(id: string) {
    setUsuarios((atuais) => atuais.filter((usuario) => usuario.id !== id));
  }

  return { usuarios, criarUsuario, atualizarUsuario, excluirUsuario };
}
