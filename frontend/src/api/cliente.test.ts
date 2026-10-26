import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroApi, errosPorCampo, mensagemDeErro, registrarSessaoExpirada, requisicao } from "./cliente";

// troca o fetch por uma resposta pronta, sem chamar rede de verdade
function respondeCom(status: number, corpo: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => (corpo === undefined ? Promise.reject(new Error("sem corpo")) : Promise.resolve(corpo)),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requisicao: erros", () => {
  it("usa a mensagem do backend", async () => {
    respondeCom(409, { mensagem: "Código já cadastrado." });
    await expect(requisicao("/products")).rejects.toMatchObject({ status: 409, mensagem: "Código já cadastrado." });
  });

  it("junta as mensagens por campo quando o backend manda erros[]", async () => {
    respondeCom(400, {
      mensagem: "Dados inválidos.",
      erros: [
        { campo: "email", mensagem: "O E-mail é obrigatório. " },
        { campo: "cpf", mensagem: "CPF inválido." },
      ],
    });
    await expect(requisicao("/users")).rejects.toMatchObject({
      status: 400,
      mensagem: "O E-mail é obrigatório. CPF inválido.",
    });
  });

  it("usa texto padrão quando o servidor não manda JSON", async () => {
    respondeCom(500, undefined);
    await expect(requisicao("/products")).rejects.toMatchObject({
      status: 500,
      mensagem: "O servidor está com problemas. Tente novamente em instantes.",
    });
    respondeCom(403, undefined);
    await expect(requisicao("/users")).rejects.toMatchObject({
      mensagem: "Você não tem permissão para fazer isso.",
    });
  });

  it("status 0 quando o servidor não responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(requisicao("/products")).rejects.toMatchObject({ status: 0 });
  });
});

describe("requisicao: sessão expirada (401)", () => {
  it("avisa quem se registrou quando a chamada tinha token", async () => {
    const aoExpirar = vi.fn();
    const desfazer = registrarSessaoExpirada(aoExpirar);
    respondeCom(401, { mensagem: "Token inválido." });
    await expect(requisicao("/users", { token: "abc" })).rejects.toBeInstanceOf(ErroApi);
    expect(aoExpirar).toHaveBeenCalledTimes(1);
    desfazer();
  });

  it("não avisa em 401 sem token (login errado)", async () => {
    const aoExpirar = vi.fn();
    const desfazer = registrarSessaoExpirada(aoExpirar);
    respondeCom(401, { mensagem: "Credenciais inválidas." });
    await expect(requisicao("/auth/login", { metodo: "POST", corpo: {} })).rejects.toBeInstanceOf(ErroApi);
    expect(aoExpirar).not.toHaveBeenCalled();
    desfazer();
  });

  it("depois de desfazer o registro, não chama mais", async () => {
    const aoExpirar = vi.fn();
    registrarSessaoExpirada(aoExpirar)();
    respondeCom(401, { mensagem: "Token inválido." });
    await expect(requisicao("/users", { token: "abc" })).rejects.toBeInstanceOf(ErroApi);
    expect(aoExpirar).not.toHaveBeenCalled();
  });
});

describe("errosPorCampo", () => {
  it("mapeia campo -> mensagem, ficando com a primeira de cada campo", () => {
    const falha = new ErroApi(400, "x", [
      { campo: "email", mensagem: " Inválido. " },
      { campo: "email", mensagem: "Outra." },
      { campo: "cpf", mensagem: "CPF inválido." },
    ]);
    expect(errosPorCampo(falha)).toEqual({ email: "Inválido.", cpf: "CPF inválido." });
  });

  it("devolve {} pra erro sem campos ou que não é ErroApi", () => {
    expect(errosPorCampo(new ErroApi(500, "x"))).toEqual({});
    expect(errosPorCampo(new Error("x"))).toEqual({});
  });
});

describe("mensagemDeErro", () => {
  it("texto do ErroApi ou texto genérico", () => {
    expect(mensagemDeErro(new ErroApi(404, "Sumiu."))).toBe("Sumiu.");
    expect(mensagemDeErro(new Error("x"))).toBe("Algo deu errado. Tente novamente.");
  });
});
