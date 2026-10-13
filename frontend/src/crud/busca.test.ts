import { describe, expect, it } from "vitest";
import { contemTexto, normalizarTexto } from "./busca";

describe("normalizarTexto", () => {
  it("deixa minúsculo e tira os acentos", () => {
    expect(normalizarTexto("Válvula de Retenção")).toBe("valvula de retencao");
  });
});

describe("contemTexto", () => {
  it("acha o termo ignorando acento e maiúsculas dos dois lados", () => {
    expect(contemTexto("Acessórios & Lazer", "ACESSORIO")).toBe(true);
    expect(contemTexto("Filtro", "fíltro")).toBe(true);
  });

  it("termo vazio (ou só espaços) combina com tudo", () => {
    expect(contemTexto("Qualquer coisa", "   ")).toBe(true);
  });

  it("devolve false quando o termo não aparece ou o alvo é vazio", () => {
    expect(contemTexto("Mangueira", "bomba")).toBe(false);
    expect(contemTexto(null, "bomba")).toBe(false);
  });
});
