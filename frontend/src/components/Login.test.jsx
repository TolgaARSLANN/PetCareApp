import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import Login from "./Login";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const WhoAmI = () => <p>Kullanıcı: {useAuth().user?.id}</p>;

const renderLogin = (state) => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pets" element={<WhoAmI />} />
          <Route path="/pets/p1" element={<p>Pamuk sayfası</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

const fillAndSubmit = async (user) => {
  await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
  await user.type(screen.getByLabelText(/Parola/, { selector: "input" }), "secret1");
  await user.click(screen.getByRole("button", { name: "Giriş yap" }));
};

describe("Login", () => {
  beforeEach(() => {
    vi.mocked(API.get).mockReset().mockResolvedValue({ data: { userId: null } }); // oturum yok
    vi.mocked(API.post).mockReset();
    localStorage.clear();
  });

  test("starts the session and goes to the pets page without storing a token", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { userId: "u1" } });
    renderLogin();

    await fillAndSubmit(user);

    expect(API.post).toHaveBeenCalledWith("/auth/login", { email: "a@b.com", password: "secret1" });
    expect(await screen.findByText("Kullanıcı: u1")).toBeInTheDocument();
    // Token sayfa kodunun erişebildiği bir yerde tutulmaz
    expect(localStorage.length).toBe(0);
  });

  test("returns to the page that required login", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { userId: "u1" } });
    renderLogin({ from: "/pets/p1" });

    await fillAndSubmit(user);

    expect(await screen.findByText("Pamuk sayfası")).toBeInTheDocument();
  });

  test("explains wrong credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockRejectedValue({ response: { status: 400 } });
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("E-posta veya parola hatalı");
  });

  test("explains the attempt limit", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockRejectedValue({ response: { status: 429 } });
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("15 dakika sonra");
  });

  test("explains when the server cannot be reached", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockRejectedValue(new Error("Network Error"));
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Sunucuya ulaşılamadı");
  });

  test("lets the user show the password", async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText(/Parola/, { selector: "input" });
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Parolayı göster" }));
    expect(password).toHaveAttribute("type", "text");
  });
});
