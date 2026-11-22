import { afterEach, describe, expect, it, vi } from "vitest";
import { formatLocalizedDate, formatLocalizedRelativeDate, getDateLocale, getDateFnsLocale } from "@/lib/date-format";

afterEach(() => {
  vi.useRealTimers();
});

describe("localized date formatting", () => {
  it("uses the locale associated with the selected app language", () => {
    expect(getDateLocale("en")).toBe("en-US");
    expect(getDateLocale("es")).toBe("es-ES");
    expect(getDateLocale("pt")).toBe("pt-BR");
    expect(getDateLocale("fr")).toBe("fr-FR");
  });

  it("formats dates in the selected language's ordering", () => {
    expect(formatLocalizedDate("2026-10-23", "en")).toBe("10/23/26");
    expect(formatLocalizedDate("2026-10-23", "pt")).toBe("23/10/2026");
    expect(formatLocalizedDate("2026-10-23", "fr")).toBe("23/10/2026");
  });

  it("provides localized date-fns calendars", () => {
    expect(getDateFnsLocale("en").code).toBe("en-US");
    expect(getDateFnsLocale("es").code).toBe("es");
    expect(getDateFnsLocale("pt").code).toBe("pt-BR");
    expect(getDateFnsLocale("fr").code).toBe("fr");
  });

  it("localizes relative date labels", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00"));

    expect(formatLocalizedRelativeDate("2026-10-23T10:00:00", "es")).toBe("hoy");
    expect(formatLocalizedRelativeDate("2026-10-22T10:00:00", "pt")).toBe("ontem");
  });

  it("puts the day before the month in full dates for pt, es and fr", () => {
    expect(formatLocalizedDate("2026-10-23", "pt", { dateStyle: "full" })).toBe("sexta-feira, 23 de outubro de 2026");
    expect(formatLocalizedDate("2026-10-23", "en", { dateStyle: "full" })).toBe("Friday, October 23, 2026");
  });

  it("falls back to English when the language is missing", () => {
    expect(getDateLocale(undefined as never)).toBe("en-US");
  });

  it("includes the year for relative dates from a previous year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00"));
    expect(formatLocalizedRelativeDate("2025-03-05T10:00:00", "pt")).toBe("5 de mar. de 2025");
  });
});

describe("calendar day timestamps", () => {
  it("keeps UTC-midnight day timestamps on the same day", () => {
    expect(formatLocalizedDate("2026-11-03T00:00:00.000Z", "pt")).toBe("03/11/2026");
  });
  it("accepts regional language codes like pt-BR", () => {
    expect(formatLocalizedDate("2026-10-23", "pt-BR" as never)).toBe("23/10/2026");
  });
});
