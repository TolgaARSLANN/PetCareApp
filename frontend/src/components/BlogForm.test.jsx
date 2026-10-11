import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogForm from "./BlogForm";

const fill = async (user, image) => {
  await user.type(screen.getByLabelText(/Başlık/), "Başlık");
  await user.type(screen.getByLabelText(/İçerik/), "İçerik");
  await user.type(screen.getByLabelText(/Yazar adı/), "Ayşe");
  if (image) await user.type(screen.getByLabelText(/Kapak görseli/), image);
};

describe("BlogForm cover image", () => {
  test("a non-https address is explained and not sent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BlogForm submitLabel="Yayınla" onSubmit={onSubmit} />);
    await fill(user, "http://example.com/kedi.jpg");
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(screen.getByText("Kapak görseli https:// ile başlayan bir adres olmalı.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("an https address is sent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<BlogForm submitLabel="Yayınla" onSubmit={onSubmit} />);
    await fill(user, "https://example.com/kedi.jpg");
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image: "https://example.com/kedi.jpg" }));
  });
});
