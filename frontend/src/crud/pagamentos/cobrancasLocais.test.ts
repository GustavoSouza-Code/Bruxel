import { describe, expect, it } from "vitest";
import { lerCobrancas, registrarCobranca } from "./cobrancasLocais";

describe("lerCobrancas", () => {
  it("devolve {} pra null, JSON quebrado e formato errado", () => {
    expect(lerCobrancas(null)).toEqual({});
    expect(lerCobrancas("{")).toEqual({});
    expect(lerCobrancas("[]")).toEqual({});
  });

  it("descarta valor que não é texto", () => {
    expect(lerCobrancas('{"a":"2026-10-21T12:00:00.000Z","b":5,"c":null}')).toEqual({
      a: "2026-10-21T12:00:00.000Z",
    });
  });
});

describe("registrarCobranca", () => {
  it("põe ou troca a data sem mexer no mapa original", () => {
    const antes = { a: "2026-10-01T12:00:00.000Z" };
    const depois = registrarCobranca(antes, "a", new Date("2026-10-28T12:00:00.000Z"));
    expect(depois).toEqual({ a: "2026-10-28T12:00:00.000Z" });
    expect(antes).toEqual({ a: "2026-10-01T12:00:00.000Z" });
    expect(registrarCobranca(depois, "b", new Date("2026-10-28T13:00:00.000Z"))).toEqual({
      a: "2026-10-28T12:00:00.000Z",
      b: "2026-10-28T13:00:00.000Z",
    });
  });
});
