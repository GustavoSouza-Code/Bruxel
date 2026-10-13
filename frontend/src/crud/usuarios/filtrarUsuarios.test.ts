import { describe, expect, it } from "vitest";
import type { Usuario } from "../../tipos/usuario";
import {
  FILTROS_USUARIO_INICIAIS,
  contarFiltrosAtivosUsuario,
  filtrarUsuarios,
  opcoesDeEstado,
} from "./filtrarUsuarios";
import type { FiltrosUsuario } from "./filtrarUsuarios";

function usuario(dados: Partial<Usuario> & Pick<Usuario, "id" | "nome">): Usuario {
  return { email: `${dados.id}@x.com`, cpf: "00000000000", perfil: "CLIENTE", ...dados };
}

const USUARIOS: Usuario[] = [
  usuario({ id: "1", nome: "João Silva", email: "joao@bruxel.com", cpf: "12345678901", cidade: "Lajeado", estado: "RS" }),
  usuario({ id: "2", nome: "Ana Souza", email: "ana@gmail.com", cpf: "98765432100", cidade: "Estrela", estado: "rs", perfil: "ADMINISTRADOR" }),
  usuario({ id: "3", nome: "Bruno Lima", email: "bruno@gmail.com", cidade: "Florianópolis", estado: "SC" }),
  usuario({ id: "4", nome: "Carla Dias", email: "carla@gmail.com", cidade: null, estado: null }),
];

function filtros(mudancas: Partial<FiltrosUsuario>): FiltrosUsuario {
  return { ...FILTROS_USUARIO_INICIAIS, ...mudancas };
}

const ids = (lista: Usuario[]) => lista.map((u) => u.id);

describe("filtrarUsuarios", () => {
  it("sem filtros devolve todos, em ordem alfabética", () => {
    expect(ids(filtrarUsuarios(USUARIOS, FILTROS_USUARIO_INICIAIS))).toEqual(["2", "3", "4", "1"]);
  });

  it("busca pelo nome sem ligar pra acento", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ busca: "joao" })))).toEqual(["1"]);
  });

  it("busca pelo e-mail", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ busca: "@bruxel" })))).toEqual(["1"]);
  });

  it("busca pelo CPF com ou sem pontuação", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ busca: "987.654" })))).toEqual(["2"]);
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ busca: "98765" })))).toEqual(["2"]);
  });

  it("filtra pelo perfil", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ perfil: "ADMINISTRADOR" })))).toEqual(["2"]);
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ perfil: "CLIENTE" })))).toEqual(["3", "4", "1"]);
  });

  it("filtra pela cidade sem ligar pra acento", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ cidade: "florianopolis" })))).toEqual(["3"]);
  });

  it("filtra pela UF sem ligar pra maiúsculas", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ estado: "RS" })))).toEqual(["2", "1"]);
  });

  it("ordena de Z a A", () => {
    expect(ids(filtrarUsuarios(USUARIOS, filtros({ ordem: "nome-desc" })))).toEqual(["1", "4", "3", "2"]);
  });
});

describe("opcoesDeEstado", () => {
  it("lista as UFs que existem, sem repetir, em maiúsculas e em ordem", () => {
    expect(opcoesDeEstado(USUARIOS)).toEqual(["RS", "SC"]);
  });
});

describe("contarFiltrosAtivosUsuario", () => {
  it("é zero sem filtros, e não conta busca nem perfil (que já aparecem na tela)", () => {
    expect(contarFiltrosAtivosUsuario(filtros({ busca: "x", perfil: "CLIENTE" }))).toBe(0);
  });

  it("conta cidade, UF e ordem diferente da padrão", () => {
    expect(
      contarFiltrosAtivosUsuario(filtros({ cidade: "Lajeado", estado: "RS", ordem: "nome-desc" }))
    ).toBe(3);
  });
});
