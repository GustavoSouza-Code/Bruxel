import type { Usuario } from "../../tipos/usuario";
import { FILTROS_USUARIO_INICIAIS, filtrarUsuarios } from "../usuarios/filtrarUsuarios";

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

/**
 * O problema com a escolha do cliente, ou null se dá pra enviar. O backend só
 * abre pedido pra uma conta cadastrada (ver o recado no spec).
 */
export function validarClienteDaLoja(cliente: Usuario | null): string | null {
  return cliente ? null : "Escolha o cliente. Quem ainda não tem conta precisa ser cadastrado antes.";
}

/**
 * "12345678901" → "•••.456.789-••": o atendente confere o cliente sem expor o CPF inteiro na tela.
 * Fora do formato, não mostra nada do número.
 */
export function mascararCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return "•••";
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}
