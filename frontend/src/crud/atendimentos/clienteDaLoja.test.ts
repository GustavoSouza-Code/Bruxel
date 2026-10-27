import { describe, expect, it } from "vitest";
import type { Usuario } from "../../tipos/usuario";
import { buscarClientes, mascararCpf, validarClienteDaLoja } from "./clienteDaLoja";

function usuario(dados: Partial<Usuario> & Pick<Usuario, "id" | "nome">): Usuario {
  return { email: `${dados.id}@exemplo.com`, cpf: "00000000000", perfil: "CLIENTE", ...dados };
}

const USUARIOS: Usuario[] = [
  usuario({ id: "1", nome: "João Silva", email: "js@email.com", cpf: "12345678901" }),
  usuario({ id: "2", nome: "Maria Oliveira", email: "maria@email.com", cpf: "98765432100" }),
  usuario({ id: "3", nome: "Joana Gerente", email: "joana@bruxel.com", perfil: "ADMINISTRADOR" }),
];

const ids = (lista: Usuario[]) => lista.map((u) => u.id);

describe("buscarClientes", () => {
  it("acha pelo nome sem ligar pra acento", () => {
    expect(ids(buscarClientes(USUARIOS, "joao"))).toEqual(["1"]);
  });

  it("acha pelo e-mail e por um pedaço do CPF", () => {
    expect(ids(buscarClientes(USUARIOS, "maria@"))).toEqual(["2"]);
    expect(ids(buscarClientes(USUARIOS, "456.789"))).toEqual(["1"]);
  });

  it("só mostra clientes, nunca administradores", () => {
    expect(buscarClientes(USUARIOS, "joana")).toEqual([]);
  });

  it("com menos de 2 letras não sugere ninguém", () => {
    expect(buscarClientes(USUARIOS, "j")).toEqual([]);
    expect(buscarClientes(USUARIOS, "  j  ")).toEqual([]);
  });

  it("sugere no máximo 6", () => {
    const muitos = Array.from({ length: 10 }, (_, i) => usuario({ id: `c${i}`, nome: `Cliente ${i}` }));
    expect(buscarClientes(muitos, "cliente")).toHaveLength(6);
  });
});

describe("validarClienteDaLoja", () => {
  it("sem ninguém escolhido é recusado", () => {
    expect(validarClienteDaLoja(null)).toBe("Escolha o cliente. Quem ainda não tem conta precisa ser cadastrado antes.");
  });

  it("com cliente escolhido passa", () => {
    expect(validarClienteDaLoja(USUARIOS[0])).toBeNull();
  });
});

describe("mascararCpf", () => {
  it("mostra só os dígitos do meio", () => {
    expect(mascararCpf("12345678901")).toBe("•••.456.789-••");
  });

  it("CPF fora do formato não aparece na tela", () => {
    expect(mascararCpf("123")).toBe("•••");
  });
});
