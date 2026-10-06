import { useEffect, useState } from "react";
import type { Usuario } from "../../tipos/usuario";
import type { DadosFormularioCadastro } from "./FormularioCadastro/FormularioCadastro";
import { userService } from "../../services/userService";
import type { ApiUser } from "../../services/userService";
import { useAuth } from "../../contexto/AuthContext";

/**
 * Converte o usuário do jeito que o backend devolve (campos nulos quando
 * vazios, mais criado_em/atualizado_em que a tela não usa) pro tipo
 * `Usuario` que o resto do front usa (campos opcionais, sem undefined vs
 * null pra lidar).
 */
function toUsuario(apiUser: ApiUser): Usuario {
  return {
    id: apiUser.id,
    nome: apiUser.nome,
    email: apiUser.email,
    cpf: apiUser.cpf,
    telefone: apiUser.telefone ?? undefined,
    rua: apiUser.rua ?? undefined,
    numero: apiUser.numero ?? undefined,
    bairro: apiUser.bairro ?? undefined,
    cidade: apiUser.cidade ?? undefined,
    estado: apiUser.estado ?? undefined,
    cep: apiUser.cep ?? undefined,
    perfil: apiUser.perfil,
  };
}

/**
 * CRUD de usuários: busca a lista real em GET /api/users (precisa de
 * login de administrador — ver userRoutes.ts) e cria usuários de verdade
 * via POST /api/users. Editar e excluir ainda só mudam a lista na tela
 * (TODO: ligar atualizarUsuario/excluirUsuario em PUT/DELETE /api/users/:id).
 */
export function useUsuarios() {
  const { token, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // sem login de admin não tem como listar (a rota exige token+perfil) —
    // evita disparar uma chamada que vai dar 401/403 de cara
    if (!token || !isAdmin) return;

    let cancelled = false;

    async function carregarUsuarios() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const apiUsers = await userService.getAll(token!);
        if (!cancelled) setUsuarios(apiUsers.map(toUsuario));
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os usuários."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    carregarUsuarios();
    return () => {
      cancelled = true;
    };
  }, [token, isAdmin]);

  async function criarUsuario(data: DadosFormularioCadastro) {
    const criado = await userService.create({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      cpf: data.cpf.replace(/\D/g, ""),
    });
    setUsuarios((current) => [...current, toUsuario(criado)]);
  }

  // substitui o usuário que tem o mesmo id pela versão editada
  // TODO: chamar userService.update(id, ..., token) aqui também
  function atualizarUsuario(atualizado: Usuario) {
    setUsuarios((current) =>
      current.map((usuario) => (usuario.id === atualizado.id ? atualizado : usuario))
    );
  }

  // TODO: chamar userService.delete(id, token) aqui também
  function excluirUsuario(id: string) {
    setUsuarios((current) => current.filter((usuario) => usuario.id !== id));
  }

  return {
    usuarios,
    isLoading,
    loadError,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
  };
}
