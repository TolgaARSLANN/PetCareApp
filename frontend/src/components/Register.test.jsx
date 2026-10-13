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

// Etiket metninde zorunlu alan işareti de var ("Parola *")
const passwordInput = () => screen.getByLabelText(/^Parola\s*\*?$/, { selector: "input" });
const repeatInput = () => screen.getByLabelText(/Parola \(tekrar\)/, { selector: "input" });

const termsBox = () => screen.getByRole("checkbox", { name: /18 yaşından büyüğüm/ });
// Kutu işaretli değilse işaretler (formu ikinci kez gönderen testlerde işareti kaldırmasın)
const acceptTerms = async (user) => {
  if (!termsBox().checked) await user.click(termsBox());
};

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
    vi.mocked(API.get)
      .mockReset()
      .mockResolvedValue({ data: { userId: null } });
    vi.mocked(API.post).mockReset();
  });

  test("a new account is logged in straight away", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { userId: "u7", displayName: "Ayşe" } });
    await renderRegister();

    await user.type(screen.getByLabelText(/Görünen ad/), "Ayşe");
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(passwordInput(), "secret1");
    await user.type(repeatInput(), "secret1");
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));

    expect(API.post).toHaveBeenCalledWith("/auth/register", { displayName: "Ayşe", email: "a@b.com", password: "secret1", acceptTerms: true });
    expect(await screen.findByText("Evcil dostlar: u7")).toBeInTheDocument();
  });

  test("a password over 72 bytes is explained before sending", async () => {
    const user = userEvent.setup();
    await renderRegister();
    await user.type(screen.getByLabelText(/Görünen ad/), "Ayşe");
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(passwordInput(), "ğ".repeat(37));
    await user.type(repeatInput(), "ğ".repeat(37));
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));

    expect(screen.getByText(/Parola çok uzun/)).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });

  test("passwords that do not match are explained at the field and nothing is sent", async () => {
    const user = userEvent.setup();
    await renderRegister();
    await user.type(screen.getByLabelText(/Görünen ad/), "Ayşe");
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(passwordInput(), "secret1");
    await user.type(repeatInput(), "secret2");
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));

    expect(screen.getByText("Parolalar eşleşmiyor.")).toBeInTheDocument();
    expect(repeatInput()).toHaveAttribute("aria-invalid", "true");
    expect(repeatInput()).toHaveFocus();
    expect(API.post).not.toHaveBeenCalled();

    // Düzeltince uyarı kalkar ve kayıt gönderilir
    vi.mocked(API.post).mockResolvedValue({ data: { userId: "u7" } });
    await user.clear(repeatInput());
    await user.type(repeatInput(), "secret1");
    expect(screen.queryByText("Parolalar eşleşmiyor.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));
    expect(API.post).toHaveBeenCalledWith("/auth/register", { displayName: "Ayşe", email: "a@b.com", password: "secret1", acceptTerms: true });
  });

  test("the warning waits until the user leaves the repeat field", async () => {
    const user = userEvent.setup();
    await renderRegister();
    await user.type(passwordInput(), "secret1");
    await user.type(repeatInput(), "sec");
    expect(screen.queryByText("Parolalar eşleşmiyor.")).not.toBeInTheDocument(); // yazarken uyarma
    await user.tab();
    expect(screen.getByText("Parolalar eşleşmiyor.")).toBeInTheDocument();
  });

  test("a display name someone else uses is explained in Turkish", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockRejectedValue({ response: { status: 400, data: { message: "Display name in use" } } });
    await renderRegister();
    await user.type(screen.getByLabelText(/Görünen ad/), "Ayşe");
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(passwordInput(), "secret1");
    await user.type(repeatInput(), "secret1");
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));
    expect(await screen.findByText(/başka bir üye tarafından kullanılıyor/)).toBeInTheDocument();
  });

  test("the age and terms box must be ticked; the privacy notice is linked separately", async () => {
    const user = userEvent.setup();
    await renderRegister();
    expect(termsBox()).not.toBeChecked();
    expect(termsBox()).toBeRequired();
    expect(screen.getByRole("link", { name: "Kullanım Koşulları" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Gizlilik ve Aydınlatma Metni" })).toHaveAttribute("href", "/privacy");

    await user.type(screen.getByLabelText(/Görünen ad/), "Ayşe");
    await user.type(screen.getByLabelText(/E-posta/), "a@b.com");
    await user.type(passwordInput(), "secret1");
    await user.type(repeatInput(), "secret1");
    await user.click(screen.getByRole("button", { name: /Üye ol|Hesap oluştur/ }));
    expect(API.post).not.toHaveBeenCalled(); // tarayıcı işaretsiz kutuyla göndermez
  });
});
