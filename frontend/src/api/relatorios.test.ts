import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroApi } from "./cliente";
import { baixarRelatorio, buscarRelatorio, dataLocalIso } from "./relatorios";

const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("buscarRelatorio", () => {
  it("chama /reports/:tipo com a query, formato=json e o token", async () => {
    const relatorio = { titulo: "Atendimentos", periodo: "", geradoEm: "", colunas: [], linhas: [], totais: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(relatorio) }),
    );

    const resultado = await buscarRelatorio("t", "atendimentos", "inicio=2026-11-01");

    const [endereco, init] = vi.mocked(fetch).mock.calls[0];
    expect(endereco).toBe(`${URL_BASE}/reports/atendimentos?inicio=2026-11-01&formato=json`);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer t");
    expect(resultado).toEqual(relatorio);
  });

  it("sem filtros usa só formato=json", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }));

    await buscarRelatorio("t", "pedidos", "");

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${URL_BASE}/reports/pedidos?formato=json`);
  });
});

describe("baixarRelatorio", () => {
  it("rejeita com o ErroApi do backend quando o relatório é grande demais", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ mensagem: "O relatório passa de 5000 linhas. Reduza o período." }),
      }),
    );

    const falha = await baixarRelatorio("t", "pedidos", "csv", "").catch((e: unknown) => e);

    expect(falha).toBeInstanceOf(ErroApi);
    expect((falha as ErroApi).status).toBe(400);
    expect((falha as ErroApi).mensagem).toBe("O relatório passa de 5000 linhas. Reduza o período.");
  });

  it("pede o formato pdf e baixa o arquivo com o nome do relatório", async () => {
    const blob = new Blob(["%PDF"]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) }),
    );
    vi.useFakeTimers();
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    const anexar = vi.fn();
    vi.stubGlobal("document", { createElement: vi.fn().mockReturnValue(link), body: { appendChild: anexar } });
    const criar = vi.fn().mockReturnValue("blob:x");
    const revogar = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: criar, revokeObjectURL: revogar });

    await baixarRelatorio("t", "pedidos", "pdf", "inicio=2026-11-01");

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${URL_BASE}/reports/pedidos?inicio=2026-11-01&formato=pdf`);
    expect(criar).toHaveBeenCalledWith(blob);
    expect(link.href).toBe("blob:x");
    expect(link.download).toBe(`relatorio-pedidos-${dataLocalIso(new Date())}.pdf`);
    expect(anexar).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(revogar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revogar).toHaveBeenCalledWith("blob:x");
  });
});

describe("dataLocalIso", () => {
  it("usa a data local, não a UTC", () => {
    expect(dataLocalIso(new Date(2026, 10, 16, 23, 30))).toBe("2026-11-16");
  });
});
