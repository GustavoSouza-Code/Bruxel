import { describe, expect, it } from "vitest";
import { formatarData, paraDataIso } from "./datasAtendimento";

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
