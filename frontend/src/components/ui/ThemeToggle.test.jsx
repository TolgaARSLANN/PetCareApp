import React from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "./ThemeToggle";

// jsdom'da matchMedia yok; sistem tercihi "açık" gibi davranan basit bir taklit
window.matchMedia =
  window.matchMedia ||
  ((query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  test("switches to dark and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Koyu temaya geç" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Açık temaya geç" })).toBeInTheDocument();
  });

  test("starts from the theme set before render", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Açık temaya geç" })).toBeInTheDocument();
  });
});
