/** O que a pessoa digita na aba "Senha" do perfil. */
export interface CamposTrocaSenha {
  atual: string;
  nova: string;
  confirmacao: string;
}

/** Mensagem de erro por campo; campo sem erro não aparece. */
export type ErrosTrocaSenha = Partial<Record<keyof CamposTrocaSenha, string>>;

// mesmo mínimo do backend (SENHA_MIN no userService)
const SENHA_MIN = 8;

/**
 * Confere a troca de senha antes de enviar. A senha atual certa só o
 * backend sabe: se estiver errada, ele responde "Senha atual incorreta.".
 */
export function validarTrocaSenha({ atual, nova, confirmacao }: CamposTrocaSenha): ErrosTrocaSenha {
  const erros: ErrosTrocaSenha = {};

  if (!atual) erros.atual = "Informe a senha atual.";

  if (!nova) erros.nova = "Informe a nova senha.";
  else if (nova.length < SENHA_MIN) erros.nova = `A nova senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  else if (nova === atual) erros.nova = "A nova senha precisa ser diferente da atual.";

  if (!confirmacao) erros.confirmacao = "Confirme a nova senha.";
  else if (confirmacao !== nova) erros.confirmacao = "As senhas não conferem.";

  return erros;
}
