import { describe, expect, test } from "vitest";
import { formatKg, linearScale, niceTicks, timeTickFormatter, timeTicks } from "./chart";

describe("niceTicks", () => {
  test("covers the range with round steps", () => {
    const ticks = niceTicks(4.2, 4.6);
    expect(ticks[0]).toBeLessThanOrEqual(4.2);
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(4.6);
    expect(ticks).toEqual([4.2, 4.3, 4.4, 4.5, 4.6]);
  });

  test("uses larger steps for larger ranges", () => {
    expect(niceTicks(12, 31)).toEqual([10, 15, 20, 25, 30, 35]);
  });

  test("opens a small range around a single value", () => {
    const ticks = niceTicks(5, 5);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks[0]).toBeLessThan(5);
    expect(ticks.at(-1)).toBeGreaterThan(5);
  });

  test("returns no ticks for invalid input", () => {
    expect(niceTicks(NaN, 3)).toEqual([]);
  });
});

describe("scales and ticks", () => {
  test("linearScale maps and centers a zero-width domain", () => {
    expect(linearScale([0, 10], [0, 100])(2.5)).toBe(25);
    expect(linearScale([5, 5], [0, 100])(5)).toBe(50);
  });

  test("timeTicks keeps every date when there are few", () => {
    expect(timeTicks([3, 1, 2, 2])).toEqual([1, 2, 3]);
  });

  test("timeTicks spreads ticks evenly when there are many", () => {
    expect(timeTicks([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)).toEqual([0, 4, 8]);
  });

  test("date labels switch to month + year over long ranges", () => {
    const short = timeTickFormatter([Date.parse("2026-06-01"), Date.parse("2026-10-01")]);
    const long = timeTickFormatter([Date.parse("2024-01-01"), Date.parse("2026-10-01")]);
    expect(short(Date.parse("2026-06-01"))).toMatch(/1 Haz/);
    expect(long(Date.parse("2026-06-01"))).toMatch(/Haz.*2026/);
  });

  test("formatKg uses Turkish decimals", () => {
    expect(formatKg(4.25)).toBe("4,25 kg");
  });
});
