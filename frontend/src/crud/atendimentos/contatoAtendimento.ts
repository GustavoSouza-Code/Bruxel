import type { ContatoAtendimento } from "../../tipos/atendimento";
import type { Usuario } from "../../tipos/usuario";

/** Uma mensagem por campo do contato com problema; objeto vazio = contato ok. */
export type ErrosContato = Partial<Record<keyof ContatoAtendimento, string>>;

export const CONTATO_VAZIO: ContatoAtendimento = {
  telefone: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

/**
 * Contato inicial do formulário a partir do perfil. Sem perfil (ainda carregando
 * ou a busca falhou) começa vazio; coluna vazia no banco (null) vira "".
 */
export function contatoDoUsuario(usuario: Usuario | null): ContatoAtendimento {
  if (!usuario) return CONTATO_VAZIO;
  return {
    telefone: usuario.telefone ?? "",
    rua: usuario.rua ?? "",
    numero: usuario.numero ?? "",
    bairro: usuario.bairro ?? "",
    cidade: usuario.cidade ?? "",
    estado: usuario.estado ?? "",
    cep: usuario.cep ?? "",
  };
}

const somenteDigitos = (texto: string) => texto.replace(/\D/g, "");

// dígitos do telefone sem o código do país: "+55 51 99999-0000" colado vira "51999990000"
function digitosTelefone(telefone: string) {
  const digitos = somenteDigitos(telefone);
  const comCodigoPais = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55");
  return comCodigoPais ? digitos.slice(2) : digitos;
}

/**
 * Confere o mínimo pra visita: telefone com DDD, rua, número e cidade. Bairro,
 * UF e CEP são opcionais, mas UF e CEP preenchidos precisam do formato certo.
 */
export function validarContato(contato: ContatoAtendimento): ErrosContato {
  const erros: ErrosContato = {};

  const quantidadeDigitos = digitosTelefone(contato.telefone).length;
  if (quantidadeDigitos < 10 || quantidadeDigitos > 11) {
    erros.telefone = "Informe um telefone com DDD (10 ou 11 dígitos).";
  }
  if (!contato.rua.trim()) erros.rua = "Informe a rua.";
  if (!contato.numero.trim()) erros.numero = "Informe o número.";
  if (!contato.cidade.trim()) erros.cidade = "Informe a cidade.";
  if (contato.estado && !/^[A-Za-z]{2}$/.test(contato.estado)) {
    erros.estado = "Use a sigla do estado, com 2 letras (ex.: RS).";
  }
  if (contato.cep && somenteDigitos(contato.cep).length !== 8) {
    erros.cep = "O CEP tem 8 dígitos.";
  }

  return erros;
}
