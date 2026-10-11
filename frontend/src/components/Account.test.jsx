import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import Account from "./Account";
import { RequireAuth } from "./RouteGuards";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), post: vi.fn() } }));

const LoginProbe = () => <p>Giriş sayfası: {useLocation().state?.reason}</p>;
const HomeProbe = () => <p>Ana sayfa {useLocation().state?.accountDeleted ? "(silindi)" : ""}</p>;

const renderAccount = async () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          {/* Uygulamadaki gibi giriş korumasıyla: silme sonrası yönlendirme bununla çakışmamalı */}
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/" element={<HomeProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  await screen.findByRole("heading", { name: "Hesabım" });
};

const input = (label) => screen.getByLabelText(label, { selector: "input" });

describe("Account", () => {
  beforeEach(() => {
    vi.mocked(API.get).mockReset().mockImplementation((url) =>
      Promise.resolve(
        url === "/auth/me"
          ? { data: { userId: "u1" } }
          : { data: { email: "a@b.com", petCount: 3, blogCount: 2 } }
      )
    );
    vi.mocked(API.put).mockReset();
    vi.mocked(API.delete).mockReset();
  });

  test("shows the account email", async () => {
    await renderAccount();
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
  });

  test("changes the password", async () => {
    const user = userEvent.setup();
    vi.mocked(API.put).mockResolvedValue({ data: {} });
    await renderAccount();

    await user.type(input(/Mevcut parola/), "old-pass");
    await user.type(input(/^Yeni parola\b(?! \(tekrar\))/), "new-pass");
    await user.type(input(/Yeni parola \(tekrar\)/), "new-pass");
    await user.click(screen.getByRole("button", { name: "Parolayı değiştir" }));

    expect(API.put).toHaveBeenCalledWith("/auth/password", { currentPassword: "old-pass", newPassword: "new-pass" });
    expect(
      await screen.findByText("Parolanız değiştirildi. Diğer cihazlardaki oturumlarınız kapatıldı.")
    ).toBeInTheDocument();
    expect(input(/Mevcut parola/)).toHaveValue("");
  });

  test("does not submit when the new passwords do not match", async () => {
    const user = userEvent.setup();
    await renderAccount();

    await user.type(input(/Mevcut parola/), "old-pass");
    await user.type(input(/^Yeni parola\b(?! \(tekrar\))/), "new-pass");
    await user.type(input(/Yeni parola \(tekrar\)/), "other");
    await user.click(screen.getByRole("button", { name: "Parolayı değiştir" }));

    expect(screen.getByText("Parolalar eşleşmiyor.")).toBeInTheDocument();
    expect(input(/Yeni parola \(tekrar\)/)).toHaveAttribute("aria-invalid", "true");
    expect(API.put).not.toHaveBeenCalled();
  });

  test("explains a wrong current password", async () => {
    const user = userEvent.setup();
    vi.mocked(API.put).mockRejectedValue({ response: { status: 400, data: { message: "Current password is incorrect" } } });
    await renderAccount();

    await user.type(input(/Mevcut parola/), "wrong");
    await user.type(input(/^Yeni parola\b(?! \(tekrar\))/), "new-pass");
    await user.type(input(/Yeni parola \(tekrar\)/), "new-pass");
    await user.click(screen.getByRole("button", { name: "Parolayı değiştir" }));

    expect(await screen.findByText("Mevcut parola hatalı.")).toBeInTheDocument();
  });

  test("signs out everywhere after confirmation and explains it on the login page", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockReset().mockResolvedValue({});
    await renderAccount();

    await user.click(screen.getByRole("button", { name: "Tüm cihazlardan çıkış yap" }));
    expect(API.post).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Evet, çıkış yap" }));

    expect(API.post).toHaveBeenCalledWith("/auth/logout-all");
    expect(await screen.findByText("Giriş sayfası: signedOutEverywhere")).toBeInTheDocument();
  });

  test("deletes the account after confirmation and goes home", async () => {
    const user = userEvent.setup();
    vi.mocked(API.delete).mockResolvedValue({ data: { deletedPets: 3, deletedBlogs: 2 } });
    await renderAccount();

    // Silinecekler hem listede hem onay penceresinde yazar; listedekiler kontrol edilir
    expect(screen.getByText(/3 evcil dostunuz \(tüm sağlık/, { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText(/2 blog yazınız/, { selector: "li" })).toBeInTheDocument();
    await user.type(input(/Onay için parolanız/), "secret1");
    await user.click(screen.getByRole("button", { name: "Hesabımı sil" }));

    const dialog = screen.getByRole("dialog");
    expect(API.delete).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Evet, hesabımı sil" }));

    expect(API.delete).toHaveBeenCalledWith("/auth/account", { data: { password: "secret1" } });
    expect(await screen.findByText("Ana sayfa (silindi)")).toBeInTheDocument();
  });

  test("a wrong password keeps the account and shows the error at the field", async () => {
    const user = userEvent.setup();
    vi.mocked(API.delete).mockRejectedValue({ response: { status: 400, data: { message: "Password is incorrect" } } });
    await renderAccount();

    await user.type(input(/Onay için parolanız/), "wrong");
    await user.click(screen.getByRole("button", { name: "Hesabımı sil" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Evet, hesabımı sil" }));

    expect(await screen.findByText("Parola hatalı.")).toBeInTheDocument();
    expect(input(/Onay için parolanız/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("heading", { name: "Hesabım" })).toBeInTheDocument();
  });
});
