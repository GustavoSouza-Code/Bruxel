/** Dados de um cliente da Bruxel, do jeito que as telas do frontend usam hoje. */
export interface User {
  id: string;
  name: string;
  email: string;
  /** endereço num texto só (rua, número, cidade); ainda não é dividido em campos */
  address: string;
  phone: string;
  /** CPF ou CNPJ, como foi digitado (com pontuação) */
  document: string;
}
