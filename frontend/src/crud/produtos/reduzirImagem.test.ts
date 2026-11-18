import { describe, expect, it } from "vitest";
import {
  formatosDeSaida,
  medidasReduzidas,
  precisaReduzir,
  validarArquivoImagem,
} from "./reduzirImagem";

describe("validarArquivoImagem", () => {
  it.each(["image/gif", "image/heic", ""])("recusa o tipo %j", (type) => {
    expect(validarArquivoImagem({ type, size: 10 })).toBe("Envie uma imagem JPG, PNG ou WebP.");
  });

  it("não recusa por tamanho, a redução resolve", () => {
    expect(validarArquivoImagem({ type: "image/jpeg", size: 8 * 1024 * 1024 })).toBeNull();
  });
});

describe("medidasReduzidas", () => {
  it("reduz mantendo a proporção", () => {
    expect(medidasReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(medidasReduzidas(3000, 4000)).toEqual({ largura: 1200, altura: 1600 });
  });

  it("nunca aumenta a imagem", () => {
    expect(medidasReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
  });

  it("arredonda sem zerar o lado menor", () => {
    expect(medidasReduzidas(1601, 1)).toEqual({ largura: 1600, altura: 1 });
  });
});

describe("precisaReduzir", () => {
  it("não reduz o que já é pequeno", () => {
    expect(precisaReduzir({ size: 500_000 }, 1200, 900)).toBe(false);
  });

  it("reduz quando passa de 1 MB", () => {
    expect(precisaReduzir({ size: 2_000_000 }, 1200, 900)).toBe(true);
  });

  it("reduz quando algum lado passa de 1600", () => {
    expect(precisaReduzir({ size: 100_000 }, 2000, 900)).toBe(true);
  });
});

describe("formatosDeSaida", () => {
  it("PNG volta como PNG se o WebP não rolar", () => {
    expect(formatosDeSaida("image/png")).toEqual(["image/webp", "image/png"]);
  });

  it("os outros caem para JPEG", () => {
    expect(formatosDeSaida("image/jpeg")).toEqual(["image/webp", "image/jpeg"]);
  });
});
