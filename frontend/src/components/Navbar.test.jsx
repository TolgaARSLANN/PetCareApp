import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "./Navbar";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

// Tema düğmesi işletim sistemi tercihini okur; jsdom'da matchMedia yok
window.matchMedia ??= () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });

describe("Navbar mobile menu", () => {
  test("closes when another page is opened and with Escape", async () => {
    const user = userEvent.setup();
    vi.mocked(API.get).mockResolvedValue({ data: { userId: null } });
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Navbar />
        </MemoryRouter>
      </AuthProvider>
    );
    const toggle = screen.getByRole("button", { name: "Menüyü aç" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("link", { name: "Blog" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
