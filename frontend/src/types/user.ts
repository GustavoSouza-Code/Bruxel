/**
 * Dados de um usuário da Bruxel. Os campos têm os mesmos nomes da tabela
 * `users` do banco. A senha não fica aqui: o front só a envia no cadastro/login.
 */
export interface User {
  id: string;
  nome: string;
  email: string;
  /** CPF só com dígitos (11 caracteres), igual ao banco */
  cpf: string;
  telefone?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  /** sigla com 2 letras, ex.: "RS" */
  estado?: string;
  /** só dígitos (8 caracteres) */
  cep?: string;
  perfil: "CLIENTE" | "ADMINISTRADOR";
}
