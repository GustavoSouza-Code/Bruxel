/**
 * Dados de um usuário da Bruxel. Os campos têm os mesmos nomes da tabela
 * `users` do banco. A senha não fica aqui: o front só a envia no cadastro/login.
 *
 * Os campos opcionais podem vir `null` da API (coluna vazia no banco).
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  /** CPF só com dígitos (11 caracteres), igual ao banco */
  cpf: string;
  telefone?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  /** sigla com 2 letras, ex.: "RS" */
  estado?: string | null;
  /** só dígitos (8 caracteres) */
  cep?: string | null;
  perfil: "CLIENTE" | "ADMINISTRADOR";
}

/** O usuário logado, do jeito que o POST /auth/login devolve (só o básico). */
export type UsuarioSessao = Pick<Usuario, "id" | "nome" | "email" | "perfil">;
