import { describe, expect, it } from "vitest";
import type { Usuario } from "../../tipos/usuario";
import type { ContatoAtendimento } from "../../tipos/atendimento";
import { CONTATO_VAZIO, contatoDoUsuario, formatarTelefoneDigitado, validarContato } from "./contatoAtendimento";

const CONTATO_OK: ContatoAtendimento = {
  telefone: "51999990000",
  rua: "Rua Bento Gonçalves",
  numero: "850",
  bairro: "Centro",
  cidade: "Lajeado",
  estado: "RS",
  cep: "95900000",
};

const contato = (mudancas: Partial<ContatoAtendimento>) => ({ ...CONTATO_OK, ...mudancas });

describe("contatoDoUsuario", () => {
  it("sem perfil (carregando ou deu erro) começa vazio", () => {
    expect(contatoDoUsuario(null)).toEqual(CONTATO_VAZIO);
  });

  it("copia telefone e endereço do perfil, trocando null por texto vazio", () => {
    const usuario: Usuario = {
      id: "u1",
      nome: "Ana Souza",
      email: "ana@exemplo.com",
      cpf: "12345678901",
      perfil: "CLIENTE",
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: null,
      cidade: "Lajeado",
      estado: "RS",
      cep: null,
    };
    expect(contatoDoUsuario(usuario)).toEqual({
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "",
      cidade: "Lajeado",
      estado: "RS",
      cep: "",
    });
  });
});

describe("validarContato", () => {
  it("contato completo não tem erros", () => {
    expect(validarContato(CONTATO_OK)).toEqual({});
  });

  it("contato vazio tem erros, então o formulário abre os campos", () => {
    expect(Object.keys(validarContato(CONTATO_VAZIO)).sort()).toEqual([
      "cidade",
      "numero",
      "rua",
      "telefone",
    ]);
  });

  it("telefone aceita máscara e o +55 colado", () => {
    expect(validarContato(contato({ telefone: "(51) 99999-0000" }))).toEqual({});
    expect(validarContato(contato({ telefone: "(51) 3714-0000" }))).toEqual({});
    expect(validarContato(contato({ telefone: "+55 51 99999-0000" }))).toEqual({});
  });

  it("telefone sem DDD é recusado", () => {
    expect(validarContato(contato({ telefone: "99999-0000" })).telefone).toBe(
      "Informe um telefone com DDD (10 ou 11 dígitos)."
    );
  });

  it("exige rua, número e cidade; bairro é opcional", () => {
    expect(validarContato(contato({ rua: " ", numero: "", cidade: "", bairro: "" }))).toEqual({
      rua: "Informe a rua.",
      numero: "Informe o número.",
      cidade: "Informe a cidade.",
    });
  });

  it("UF e CEP são opcionais, mas se preenchidos precisam do formato certo", () => {
    expect(validarContato(contato({ estado: "", cep: "" }))).toEqual({});
    expect(validarContato(contato({ cep: "95900-000" }))).toEqual({});
    expect(validarContato(contato({ estado: "R", cep: "9590" }))).toEqual({
      estado: "A UF deve ter 2 letras (ex.: RS).",
      cep: "O CEP deve ter 8 dígitos.",
    });
  });
});

describe("formatarTelefoneDigitado", () => {
  it("monta o celular de 11 dígitos com DDD", () => {
    expect(formatarTelefoneDigitado("51999990000")).toBe("(51) 99999-0000");
  });

  it("monta o fixo de 10 dígitos com DDD", () => {
    expect(formatarTelefoneDigitado("5137140000")).toBe("(51) 3714-0000");
  });

  it("descarta caracteres que não são dígitos", () => {
    expect(formatarTelefoneDigitado("(51) 99999-0000")).toBe("(51) 99999-0000");
  });

  it("remove o +55 quando o número é colado inteiro", () => {
    expect(formatarTelefoneDigitado("+55 51 99999-0000")).toBe("(51) 99999-0000");
  });

  it("não passa de 11 dígitos", () => {
    expect(formatarTelefoneDigitado("519999900009999")).toBe("(51) 99999-0000");
  });

  it("formata conforme a digitação avança", () => {
    expect(formatarTelefoneDigitado("5")).toBe("(5");
    expect(formatarTelefoneDigitado("51")).toBe("(51");
    expect(formatarTelefoneDigitado("519")).toBe("(51) 9");
    expect(formatarTelefoneDigitado("519999")).toBe("(51) 9999");
    expect(formatarTelefoneDigitado("5199999")).toBe("(51) 9999-9");
    expect(formatarTelefoneDigitado("5199999000")).toBe("(51) 9999-9000");
  });

  it("apagar o campo volta para vazio e letras não viram número", () => {
    expect(formatarTelefoneDigitado("")).toBe("");
    expect(formatarTelefoneDigitado("abc")).toBe("");
  });
});

