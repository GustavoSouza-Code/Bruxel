import { describe, expect, it } from "vitest";
import { codigoAtendimento } from "./opcoesAtendimento";

describe("codigoAtendimento", () => {
  it("mostra os 8 primeiros caracteres do UUID em maiúsculo", () => {
    expect(codigoAtendimento("3f2a9c1b-0000-4000-8000-000000000001")).toBe("3F2A9C1B");
  });
});
