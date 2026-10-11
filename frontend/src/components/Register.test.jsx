import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import { GuestOnly } from "./RouteGuards";
import Register from "./Register";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const WhoAmI = () => <p>Evcil dostlar: {useAuth().user?.id}</p>;

const renderRegister = async () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route path="/pets" element={<WhoAmI />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  await screen.findByRole("button", { name: /Üye ol|Hesap oluştur/ });
};

describe("Register", () => {
  beforeEach(() => {
    vi.mocked(API.get).mockReset().mockResolvedValue({ data: { userId: null } });
    vi.mocked(API.post).mockReset();
  });

  test("a new account is logged in straight away", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { userId: "u7" } });
    await renderRegister();

    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(screen.getByLabelText(/Parola/, { selector: "input" }), "secret1");
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));

    expect(API.post).toHaveBeenCalledWith("/auth/register", { email: "a@b.com", password: "secret1" });
    expect(await screen.findByText("Evcil dostlar: u7")).toBeInTheDocument();
  });

  test("a password over 72 bytes is explained before sending", async () => {
    const user = userEvent.setup();
    await renderRegister();
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(screen.getByLabelText(/Parola/, { selector: "input" }), "ğ".repeat(37));
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));

    expect(screen.getByText(/Parola çok uzun/)).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });
});
