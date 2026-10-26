import { describe, expect, it } from "vitest";
import { enderecoDeEntrega } from "./enderecoEntrega";

describe("enderecoDeEntrega", () => {
  it("junta o endereço do perfil com o CEP formatado", () => {
    expect(
      enderecoDeEntrega({
        rua: "Rua X",
        numero: "850",
        bairro: "Centro",
        cidade: "Lajeado",
        estado: "RS",
        cep: "95900000",
      })
    ).toBe("Rua X, 850 - Centro - Lajeado - RS - CEP 95900-000");
  });

  it("sem CEP fica só o endereço", () => {
    expect(enderecoDeEntrega({ rua: "Rua X", cidade: "Lajeado" })).toBe("Rua X - Lajeado");
  });

  it("sem endereço nenhum devolve texto vazio", () => {
    expect(enderecoDeEntrega({})).toBe("");
  });
});
