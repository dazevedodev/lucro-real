import { afterEach, describe, expect, it, vi } from "vitest";
import { getPeriodStarts } from "./period";

describe("getPeriodStarts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula início do dia/semana/mês em horário de Brasília (2026-07-27 é segunda-feira)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-27T14:30:00.000Z"));

    const { dayStart, weekStart, monthStart } = getPeriodStarts();

    expect(dayStart).toBe("2026-07-27T03:00:00.000Z");
    // já é segunda-feira em horário de Brasília, então semana = mesmo dia
    expect(weekStart).toBe("2026-07-27T03:00:00.000Z");
    expect(monthStart).toBe("2026-07-01T03:00:00.000Z");
  });

  it("usa a data de Brasília, não a data UTC, perto da virada da meia-noite", () => {
    // 2026-07-29T02:00:00Z em UTC-3 ainda é 28/07 (terça), não 29/07 (quarta)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T02:00:00.000Z"));

    const { dayStart, weekStart, monthStart } = getPeriodStarts();

    expect(dayStart).toBe("2026-07-28T03:00:00.000Z");
    expect(weekStart).toBe("2026-07-27T03:00:00.000Z"); // volta pra segunda-feira
    expect(monthStart).toBe("2026-07-01T03:00:00.000Z");
  });
});
