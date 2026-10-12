import { describe, expect, test } from "vitest";
import { isPasswordTooLong } from "./validation";

describe("isPasswordTooLong", () => {
  test("counts bytes, not characters", () => {
    expect(isPasswordTooLong("a".repeat(72))).toBe(false);
    expect(isPasswordTooLong("a".repeat(73))).toBe(true);
    expect(isPasswordTooLong("ğ".repeat(36))).toBe(false);
    expect(isPasswordTooLong("ğ".repeat(37))).toBe(true);
  });
});
