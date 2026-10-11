import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Outlet } from "react-router-dom";
import RouteError from "./RouteError";
import { reloadPage } from "../utils/reload";
import { renderWithRouter } from "../test/renderWithRouter";

vi.mock("../utils/reload", async (importOriginal) => ({ ...(await importOriginal()), reloadPage: vi.fn() }));

// App.jsx ile aynı yapı: çerçeve (menü) + sayfa hatalarını yakalayan ara rota
const Layout = () => (
  <>
    <nav>
      <Link to="/broken">Bozuk sayfa</Link>
    </nav>
    <Outlet />
  </>
);

const renderBroken = (error) => {
  const Broken = () => {
    throw error;
  };
  return renderWithRouter(
    [
      {
        element: <Layout />,
        errorElement: <RouteError />,
        children: [{ errorElement: <RouteError />, children: [{ path: "/broken", element: <Broken /> }] }],
      },
    ],
    { initialEntries: ["/broken"] }
  );
};

describe("RouteError", () => {
  beforeEach(() => {
    vi.mocked(reloadPage).mockClear();
    sessionStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("an unexpected error shows a Turkish page and keeps the menu", async () => {
    const user = userEvent.setup();
    renderBroken(new Error("boom"));

    expect(await screen.findByText("Bir şeyler ters gitti", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bozuk sayfa" })).toBeInTheDocument(); // menü yerinde
    expect(screen.queryByText(/Hey developer|Unexpected Application Error/)).not.toBeInTheDocument();
    expect(reloadPage).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sayfayı yenile" }));
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  test("a missing page file after a new release reloads once to get the new version", async () => {
    renderBroken(new TypeError("Failed to fetch dynamically imported module: /assets/AboutUs-old.js"));

    expect(await screen.findByText(/yeni sürümü yükleniyor/)).toBeInTheDocument();
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  test("if it happens again right after reloading, it shows the page instead of looping", async () => {
    sessionStorage.setItem("chunkReloadAt", String(Date.now()));
    renderBroken(new TypeError("Failed to fetch dynamically imported module: /assets/AboutUs-old.js"));

    expect(await screen.findByText(/Uygulama güncellenmiş olabilir/)).toBeInTheDocument();
    expect(reloadPage).not.toHaveBeenCalled();
  });
});
