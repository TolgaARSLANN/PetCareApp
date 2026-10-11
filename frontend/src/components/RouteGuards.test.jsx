import React from "react";
import { act } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import { RequireAuth } from "./RouteGuards";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const LogoutButton = () => {
  const { logout } = useAuth();
  return (
    <button type="button" onClick={logout}>
      Çıkış
    </button>
  );
};

const renderAt = (path) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Giriş sayfası</p>} />
          <Route
            path="/pets"
            element={
              <RequireAuth>
                <p>Evcil dostlar</p>
                <LogoutButton />
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe("session and protected routes", () => {
  beforeEach(() => {
    vi.mocked(API.get).mockReset();
    vi.mocked(API.post).mockReset().mockResolvedValue({});
  });

  test("shows a protected page when the session cookie is valid", async () => {
    vi.mocked(API.get).mockResolvedValue({ data: { userId: "u1" } });
    renderAt("/pets");
    expect(screen.getByText(/Oturum kontrol ediliyor/)).toBeInTheDocument();
    expect(await screen.findByText("Evcil dostlar")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/auth/me");
  });

  test("redirects to login without a session", async () => {
    vi.mocked(API.get).mockResolvedValue({ data: { userId: null } });
    renderAt("/pets");
    expect(await screen.findByText("Giriş sayfası")).toBeInTheDocument();
  });

  test("treats an unreachable server as logged out", async () => {
    vi.mocked(API.get).mockRejectedValue(new Error("Network Error"));
    renderAt("/pets");
    expect(await screen.findByText("Giriş sayfası")).toBeInTheDocument();
  });

  test("removes a token left in localStorage by the old version", async () => {
    localStorage.setItem("token", "old");
    vi.mocked(API.get).mockResolvedValue({ data: { userId: null } });
    renderAt("/pets");
    await screen.findByText("Giriş sayfası");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("logout clears the session on the server and leaves the page", async () => {
    const user = userEvent.setup();
    vi.mocked(API.get).mockResolvedValue({ data: { userId: "u1" } });
    renderAt("/pets");

    await user.click(await screen.findByRole("button", { name: "Çıkış" }));

    expect(API.post).toHaveBeenCalledWith("/auth/logout");
    expect(await screen.findByText("Giriş sayfası")).toBeInTheDocument();
  });

  test("an expired session (401 elsewhere) sends the user to login", async () => {
    vi.mocked(API.get).mockResolvedValue({ data: { userId: "u1" } });
    renderAt("/pets");
    await screen.findByText("Evcil dostlar");

    act(() => window.dispatchEvent(new Event("auth:expired")));

    expect(await screen.findByText("Giriş sayfası")).toBeInTheDocument();
  });
});
