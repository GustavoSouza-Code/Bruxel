import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import { linkWhatsApp, textoMensagemCliente, textoSaudacao } from "./whatsapp";

describe("linkWhatsApp", () => {
  it("monta o link com o 55 do Brasil e o texto codificado", () => {
    expect(linkWhatsApp("(51) 99876-5432", "Olá, Ana!")).toBe(
      "https://wa.me/5551998765432?text=Ol%C3%A1%2C%20Ana!"
    );
    expect(linkWhatsApp("5133334444", "Oi")).toBe("https://wa.me/555133334444?text=Oi");
  });

  it("telefone que já vem com 55 não ganha outro", () => {
    expect(linkWhatsApp("+55 51 99876-5432", "Oi")).toBe("https://wa.me/5551998765432?text=Oi");
  });

  it("telefone sem DDD ou incompleto não vira link", () => {
    expect(linkWhatsApp("99876-5432", "Oi")).toBeNull();
    expect(linkWhatsApp("", "Oi")).toBeNull();
  });

  it("DDD 55 (Santa Maria, Santa Rosa) não é confundido com o código do país", () => {
    expect(linkWhatsApp("(55) 99876-5432", "Oi")).toBe("https://wa.me/5555998765432?text=Oi");
  });
});

describe("textos do WhatsApp", () => {
  it("chamam o cliente pelo primeiro nome e citam o pedido", () => {
    const atendimento = atendimentoDeTeste({
      cliente: { id: "u1", nome: "Ana Paula Souza" },
      mensagemCliente: "Não atendemos o seu bairro nesse dia.",
    });
    expect(textoSaudacao(atendimento)).toBe(
      "Olá, Ana! Aqui é da Bruxel Piscinas, sobre o seu pedido de atendimento #3F2A9C1B."
    );
    expect(textoMensagemCliente(atendimento)).toBe(
      "Olá, Ana! Sobre o seu pedido de atendimento #3F2A9C1B na Bruxel Piscinas: Não atendemos o seu bairro nesse dia."
    );
  });
});
