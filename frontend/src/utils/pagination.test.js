import { describe, expect, test } from "vitest";
import { pageItems, parsePage } from "./pagination";

describe("pageItems", () => {
  test("no buttons for a single page", () => {
    expect(pageItems(1, 1)).toEqual([]);
  });

  test("shows every page when there are few", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  test("collapses distant pages into gaps", () => {
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap", 9, 10]);
  });

  test("fills a one-page gap with the number instead of an ellipsis", () => {
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
  });
});

describe("parsePage", () => {
  test("accepts positive integers", () => {
    expect(parsePage("3")).toBe(3);
  });

  test("falls back to 1 for missing or invalid values", () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });
});
