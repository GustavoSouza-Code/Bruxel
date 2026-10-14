import { describe, expect, it } from "vitest";
import { formatarData, formatarDataHora, paraDataIso } from "./datasAtendimento";

describe("formatarData", () => {
  it("troca aaaa-mm-dd por dd/mm/aaaa", () => {
    expect(formatarData("2026-10-20")).toBe("20/10/2026");
  });
});

describe("paraDataIso", () => {
  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    expect(paraDataIso(new Date(2026, 9, 12, 23, 30))).toBe("2026-10-12");
  });
});

describe("formatarDataHora", () => {
  it("mostra dia e hora no relógio local", () => {
    expect(formatarDataHora(new Date(2026, 9, 13, 14, 35).toISOString())).toBe("13/10/2026 às 14:35");
    expect(formatarDataHora(new Date(2026, 9, 3, 8, 5).toISOString())).toBe("03/10/2026 às 08:05");
  });
});
