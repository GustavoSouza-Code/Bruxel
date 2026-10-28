import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import { formatarTelefone, linkOsCliente, linkWhatsApp, textoCobranca, textoMensagemCliente, textoSaudacao } from "./whatsapp";

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

describe("cobrança da OS", () => {
  it("linkOsCliente aponta pra página da OS do cliente", () => {
    expect(linkOsCliente("abc", "https://bruxel.test")).toBe("https://bruxel.test/minha-conta/atendimentos/abc");
  });

  it("textoCobranca traz código, tipo, visita, valor e o link", () => {
    const atendimento = atendimentoDeTeste({ tipo: "limpeza", data: "2026-10-18", valorMaoDeObra: 480 });
    expect(textoCobranca(atendimento, "https://bruxel.test/minha-conta/atendimentos/x")).toBe(
      "Olá, Ana! Aqui é da Bruxel Piscinas. O pagamento da ordem de serviço #3F2A9C1B (Limpeza e manutenção, visita em 18/10), no valor de R$ 480,00, ainda está em aberto. Você pode ver a OS aqui: https://bruxel.test/minha-conta/atendimentos/x\nQualquer dúvida, é só responder esta mensagem."
    );
  });

  it("o link do WhatsApp leva a quebra de linha e o R$ codificados", () => {
    expect(linkWhatsApp("51998765432", "R$ 10\nOi")).toBe("https://wa.me/5551998765432?text=R%24%2010%0AOi");
  });
});

describe("formatarTelefone", () => {
  it("celular, fixo, com 55 e o que não dá pra formatar", () => {
    expect(formatarTelefone("51998765432")).toBe("(51) 99876-5432");
    expect(formatarTelefone("5133334444")).toBe("(51) 3333-4444");
    expect(formatarTelefone("+55 51 99876-5432")).toBe("(51) 99876-5432");
    expect(formatarTelefone("123")).toBe("123");
  });
});
