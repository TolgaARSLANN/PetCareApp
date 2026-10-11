import React from "react";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import BlogList from "./BlogList";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const posts = (page) => [{ _id: `p${page}`, title: `Yazı ${page}`, content: "İçerik", author: "Ayşe" }];

// Sunucu: 3 sayfa var; aralık dışındaki sayfa son sayfaya çekilir
const serve = (totalPages = 3) =>
  vi.mocked(API.get).mockImplementation((url, config) => {
    if (url === "/auth/me") return Promise.resolve({ data: { userId: null } });
    const page = Math.min(config.params.page, totalPages);
    return Promise.resolve({ data: { items: posts(page), page, limit: 9, total: totalPages * 9, totalPages } });
  });

const LocationProbe = () => <p data-testid="location">{useLocation().search}</p>;

const renderList = (entry = "/blogs") =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/blogs"
            element={
              <>
                <BlogList />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

const blogRequests = () => vi.mocked(API.get).mock.calls.filter(([url]) => url === "/blogs");

describe("BlogList pagination", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn(); // jsdom'da yok
  });

  beforeEach(() => {
    vi.mocked(API.get).mockReset();
  });

  test("loads the page given in the address", async () => {
    serve();
    renderList("/blogs?page=2");
    expect(await screen.findByText("Yazı 2")).toBeInTheDocument();
    expect(blogRequests().at(-1)[1]).toEqual({ params: { page: 2 } });
    expect(screen.getByRole("button", { name: "Sayfa 2" })).toHaveAttribute("aria-current", "page");
  });

  test("next and numbered buttons change the page and the address", async () => {
    const user = userEvent.setup();
    serve();
    renderList();
    await screen.findByText("Yazı 1");
    expect(screen.getByRole("button", { name: /Önceki/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Sonraki/ }));
    expect(await screen.findByText("Yazı 2")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?page=2"));

    await user.click(screen.getByRole("button", { name: "Sayfa 1" }));
    expect(await screen.findByText("Yazı 1")).toBeInTheDocument();
    // 1. sayfa sade adresle gösterilir
    await waitFor(() => expect(screen.getByTestId("location")).toBeEmptyDOMElement());
  });

  test("a page past the end is corrected to the last page", async () => {
    serve();
    renderList("/blogs?page=99");
    expect(await screen.findByText("Yazı 3")).toBeInTheDocument();
    // Adres güncellemesi React Router'da geçiş (transition) olarak içerikten bir an sonra gelir
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?page=3"));
  });

  test("no page navigation when everything fits on one page", async () => {
    serve(1);
    renderList();
    await screen.findByText("Yazı 1");
    expect(screen.queryByRole("navigation", { name: "Blog sayfaları" })).not.toBeInTheDocument();
  });
});
