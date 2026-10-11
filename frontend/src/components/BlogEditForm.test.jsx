import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import API from "../services/api";
import { AuthProvider } from "../context/AuthContext";
import BlogEditForm from "./BlogEditForm";

vi.mock("../services/api", () => ({ default: { get: vi.fn(), put: vi.fn() } }));

const post = { _id: "b1", title: "Başlık", content: "İçerik", author: "Ayşe", authorId: "owner" };

const renderAs = (userId) => {
  vi.mocked(API.get).mockImplementation((url) =>
    Promise.resolve(url === "/auth/me" ? { data: { userId } } : { data: post })
  );
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/blogs/edit/b1"]}>
        <Routes>
          <Route path="/blogs/edit/:id" element={<BlogEditForm />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("BlogEditForm", () => {
  beforeEach(() => vi.mocked(API.get).mockReset());

  test("the author gets the form", async () => {
    renderAs("owner");
    expect(await screen.findByDisplayValue("Başlık")).toBeInTheDocument();
  });

  test("someone else is told the post is not theirs, without a form", async () => {
    renderAs("someone-else");
    expect(await screen.findByText("Bu yazıyı yalnızca yazarı düzenleyebilir.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Değişiklikleri kaydet" })).not.toBeInTheDocument();
  });
});
