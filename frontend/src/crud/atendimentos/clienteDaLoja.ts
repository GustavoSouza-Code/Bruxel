import type { ClienteDoAtendimento } from "../../tipos/atendimento";
import type { Usuario } from "../../tipos/usuario";
import { FILTROS_USUARIO_INICIAIS, filtrarUsuarios } from "../usuarios/filtrarUsuarios";

/**
 * Quem é o cliente quando um administrador abre o atendimento pela loja: uma conta
 * cadastrada (escolhida na busca; null enquanto não escolheu) ou só o nome de quem
 * não tem conta.
 */
export type EscolhaCliente =
  | { tipo: "cadastrado"; usuario: Usuario | null }
  | { tipo: "sem-cadastro"; nome: string };

/** O bloco "Cliente" começa na busca, sem ninguém escolhido. */
export const ESCOLHA_CLIENTE_INICIAL: EscolhaCliente = { tipo: "cadastrado", usuario: null };

// a partir de quantas letras a busca começa a sugerir, e quantas sugestões no máximo
const MIN_LETRAS_BUSCA = 2;
const MAX_SUGESTOES = 6;

/**
 * Sugestões da busca de cliente: só contas de cliente, por nome, e-mail ou CPF
 * (a mesma busca da gestão de usuários), em ordem alfabética.
 */
export function buscarClientes(usuarios: Usuario[], termo: string): Usuario[] {
  if (termo.trim().length < MIN_LETRAS_BUSCA) return [];
  return filtrarUsuarios(usuarios, { ...FILTROS_USUARIO_INICIAIS, busca: termo, perfil: "CLIENTE" }).slice(
    0,
    MAX_SUGESTOES
  );
}

/** O problema com a escolha do cliente, ou null se dá pra enviar. */
export function validarClienteDaLoja(escolha: EscolhaCliente): string | null {
  if (escolha.tipo === "cadastrado") {
    return escolha.usuario ? null : "Escolha o cliente ou digite o nome de quem não tem cadastro.";
  }
  return escolha.nome.trim().length >= 3 ? null : "Informe o nome do cliente (pelo menos 3 letras).";
}

/** O cliente que vai no pedido: a conta escolhida, ou só o nome (sem id) de quem não tem conta. */
export function clienteDoAtendimento(escolha: EscolhaCliente): ClienteDoAtendimento {
  if (escolha.tipo === "sem-cadastro") return { id: null, nome: escolha.nome.trim() };
  // depois do validarClienteDaLoja sempre tem usuário; o "?? " é só pro TypeScript
  return { id: escolha.usuario?.id ?? null, nome: escolha.usuario?.nome ?? "" };
}

/** "12345678901" → "•••.456.789-••": o atendente confere o cliente sem expor o CPF inteiro na tela. */
export function mascararCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}
