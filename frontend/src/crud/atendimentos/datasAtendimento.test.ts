import { describe, expect, it } from "vitest";
import { dataMinima, formatarData, formatarPreferencia } from "./datasAtendimento";

describe("dataMinima", () => {
  it("é o dia seguinte, no formato do input de data", () => {
    // no Date o mês começa em 0: 9 = outubro
    expect(dataMinima(new Date(2026, 9, 12))).toBe("2026-10-13");
  });

  it("vira o mês e o ano", () => {
    expect(dataMinima(new Date(2026, 11, 31))).toBe("2027-01-01");
  });

  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    // às 23h30 no Brasil já é o dia seguinte em UTC; o mínimo continua sendo "amanhã" daqui
    expect(dataMinima(new Date(2026, 9, 12, 23, 30))).toBe("2026-10-13");
  });
});

describe("formatarData", () => {
  it("troca aaaa-mm-dd por dd/mm/aaaa", () => {
    expect(formatarData("2026-10-20")).toBe("20/10/2026");
  });
});

describe("formatarPreferencia", () => {
  it("junta a data e o período, em minúsculas", () => {
    expect(formatarPreferencia("2026-10-20", "manha")).toBe("20/10/2026, manhã");
    expect(formatarPreferencia("2026-10-20", "tarde")).toBe("20/10/2026, tarde");
  });
});
