import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { capitalizeTr, formatDate, petAge, sortByDateDesc, toDateInput } from "./format";

describe("petAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  test("shows months for pets younger than a year", () => {
    expect(petAge("2025-12-20")).toBe("9 aylık");
  });

  test("shows years and months", () => {
    expect(petAge("2023-04-15")).toBe("3 yaş 5 ay");
  });

  test("shows whole years without months", () => {
    expect(petAge("2020-10-01")).toBe("6 yaşında");
  });

  test("does not count a month that has not completed yet", () => {
    expect(petAge("2026-09-20")).toBe("1 aylıktan küçük");
  });

  test("returns null for missing, invalid or future dates", () => {
    expect(petAge(null)).toBeNull();
    expect(petAge("not-a-date")).toBeNull();
    expect(petAge("2027-01-01")).toBeNull();
  });
});

describe("sortByDateDesc", () => {
  test("sorts newest first without mutating the input", () => {
    const input = [{ date: "2026-01-01" }, { date: "2026-09-01" }, { date: "2026-05-01" }];
    const sorted = sortByDateDesc(input);
    expect(sorted.map((r) => r.date)).toEqual(["2026-09-01", "2026-05-01", "2026-01-01"]);
    expect(input[0].date).toBe("2026-01-01");
  });

  test("can sort by another key and handles a missing list", () => {
    expect(sortByDateDesc([{ startDate: "2026-01-01" }, { startDate: "2026-02-01" }], "startDate")[0].startDate).toBe(
      "2026-02-01"
    );
    expect(sortByDateDesc(undefined)).toEqual([]);
  });
});

describe("formatting helpers", () => {
  test("toDateInput keeps only the date part", () => {
    expect(toDateInput("2026-03-10T00:00:00.000Z")).toBe("2026-03-10");
    expect(toDateInput(null)).toBe("");
  });

  test("formatDate shows a dash for empty or invalid values", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("nope")).toBe("-");
    expect(formatDate("2026-04-15")).toContain("2026");
  });

  test("capitalizeTr uses Turkish casing", () => {
    expect(capitalizeTr("istanbul")).toBe("İstanbul");
    expect(capitalizeTr("")).toBe("");
  });
});
