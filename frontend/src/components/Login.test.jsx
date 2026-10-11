import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API from "../services/api";
import Login from "./Login";

vi.mock("../services/api", () => ({ default: { post: vi.fn() } }));

const renderLogin = (setIsLoggedIn = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/pets" element={<p>Evcil dostlar sayfası</p>} />
      </Routes>
    </MemoryRouter>
  );
  return setIsLoggedIn;
};

const fillAndSubmit = async (user) => {
  await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
  await user.type(screen.getByLabelText(/Parola/, { selector: "input" }), "secret1");
  await user.click(screen.getByRole("button", { name: "Giriş yap" }));
};

describe("Login", () => {
  beforeEach(() => {
    vi.mocked(API.post).mockReset();
    localStorage.clear();
  });

  test("stores the token and goes to the pets page", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { token: "abc" } });
    const setIsLoggedIn = renderLogin();

    await fillAndSubmit(user);

    expect(API.post).toHaveBeenCalledWith("/auth/login", { email: "a@b.com", password: "secret1" });
    expect(localStorage.getItem("token")).toBe("abc");
    expect(setIsLoggedIn).toHaveBeenCalledWith(true);
    expect(await screen.findByText("Evcil dostlar sayfası")).toBeInTheDocument();
  });

  test("explains wrong credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockRejectedValue({ response: { status: 400 } });
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("E-posta veya parola hatalı");
    expect(localStorage.getItem("token")).toBeNull();
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
