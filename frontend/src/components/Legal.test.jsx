import React from "react";
import { describe, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import Footer from "./Footer";
import Privacy from "./Privacy";
import Terms from "./Terms";
import { CONTACT_EMAIL } from "../utils/legal";
import { renderWithRouter } from "../test/renderWithRouter";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe("legal pages", () => {
  test("a real contact address is set (it is published on both pages)", () => {
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test("the privacy notice names the controller, the contact and every service provider", () => {
    renderWithRouter([{ path: "/privacy", element: <Privacy /> }]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("KVKK Aydınlatma Metni");
    expect(screen.getAllByRole("link", { name: CONTACT_EMAIL })[0]).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
    for (const provider of ["Vercel Inc.", "Render Services, Inc.", "MongoDB, Inc."]) {
      expect(screen.getByText(provider)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Hesabım" })).toHaveAttribute("href", "/account");
  });

  test("the terms say the site is no substitute for a vet and link to the privacy notice", () => {
    renderWithRouter([{ path: "/terms", element: <Terms /> }]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Kullanım Koşulları");
    expect(screen.getByText(/veteriner hekim muayenesinin/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gizlilik ve Aydınlatma Metni" })).toHaveAttribute("href", "/privacy");
  });

  test("both pages are linked from every page's footer", async () => {
    vi.mocked(API.get).mockResolvedValue({ data: { userId: null } });
    renderWithRouter([{ path: "/", element: <Footer /> }], { wrapper: AuthProvider });
    expect(await screen.findByRole("link", { name: "Gizlilik ve Aydınlatma Metni" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Kullanım Koşulları" })).toHaveAttribute("href", "/terms");
  });
});
