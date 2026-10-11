import { describe, expect, test } from "vitest";
import { isHttpsUrl, isPasswordTooLong } from "./validation";

describe("isPasswordTooLong", () => {
  test("counts bytes, not characters", () => {
    expect(isPasswordTooLong("a".repeat(72))).toBe(false);
    expect(isPasswordTooLong("a".repeat(73))).toBe(true);
    expect(isPasswordTooLong("ğ".repeat(36))).toBe(false);
    expect(isPasswordTooLong("ğ".repeat(37))).toBe(true);
  });
});

describe("isHttpsUrl", () => {
  test("accepts only https addresses", () => {
    expect(isHttpsUrl("https://example.com/a.jpg")).toBe(true);
    expect(isHttpsUrl("http://example.com/a.jpg")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("resim.jpg")).toBe(false);
  });
});
