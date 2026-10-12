import type { Usuario } from "../../tipos/usuario";
import { contemTexto } from "../busca";

export type OrdemUsuario = "nome" | "nome-desc";

/** O que está escolhido na barra de busca, nos chips e no painel de filtros da gestão de usuários. */
export interface FiltrosUsuario {
  busca: string;
  /** "" = todos os perfis */
  perfil: "" | Usuario["perfil"];
  cidade: string;
  /** sigla da UF; "" = qualquer */
  estado: string;
  ordem: OrdemUsuario;
}

export const FILTROS_USUARIO_INICIAIS: FiltrosUsuario = {
  busca: "",
  perfil: "",
  cidade: "",
  estado: "",
  ordem: "nome",
};

// o banco guarda o CPF só com dígitos; se a pessoa digitou só números e pontuação
// ("987.654"), compara os dígitos
function buscaPorCpf(cpf: string, busca: string) {
  const digitos = busca.replace(/\D/g, "");
  return digitos !== "" && /^[\d.\-\s]+$/.test(busca) && cpf.includes(digitos);
}

function combinaComBusca(usuario: Usuario, busca: string) {
  return (
    contemTexto(usuario.nome, busca) ||
    contemTexto(usuario.email, busca) ||
    buscaPorCpf(usuario.cpf, busca)
  );
}

/** Aplica os filtros e a ordenação; devolve uma lista nova (não altera a original). */
export function filtrarUsuarios(usuarios: Usuario[], filtros: FiltrosUsuario) {
  const sentido = filtros.ordem === "nome-desc" ? -1 : 1;

  return usuarios
    .filter(
      (usuario) =>
        combinaComBusca(usuario, filtros.busca) &&
        (!filtros.perfil || usuario.perfil === filtros.perfil) &&
        // cidade vazia no filtro combina com tudo (o contemTexto já trata isso)
        contemTexto(usuario.cidade, filtros.cidade) &&
        (!filtros.estado || usuario.estado?.toUpperCase() === filtros.estado)
    )
    .sort((a, b) => sentido * a.nome.localeCompare(b.nome, "pt-BR"));
}

/** As UFs que aparecem nos usuários, sem repetir e em ordem, pro select do filtro. */
export function opcoesDeEstado(usuarios: Usuario[]) {
  const estados = usuarios
    .map((usuario) => usuario.estado?.trim().toUpperCase())
    .filter((estado): estado is string => Boolean(estado));
  return [...new Set(estados)].sort();
}

/**
 * Quantos filtros do painel estão em uso (o número do botão "Filtros (n)").
 * A busca e o perfil ficam de fora porque já aparecem na tela.
 */
export function contarFiltrosAtivosUsuario(filtros: FiltrosUsuario) {
  return [
    filtros.cidade.trim() !== "",
    filtros.estado !== "",
    filtros.ordem !== FILTROS_USUARIO_INICIAIS.ordem,
  ].filter(Boolean).length;
}
