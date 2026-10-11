import React from "react";
import { describe, expect, test, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, useNavigate } from "react-router-dom";
import BlogForm from "./BlogForm";
import { renderWithRouter } from "../test/renderWithRouter";

const fill = async (user, image) => {
  await user.type(screen.getByLabelText(/Başlık/), "Başlık");
  await user.type(screen.getByLabelText(/İçerik/), "İçerik");
  await user.type(screen.getByLabelText(/Yazar adı/), "Ayşe");
  if (image) await user.type(screen.getByLabelText(/Kapak görseli/), image);
};

// Formun yanında başka sayfaya giden bir bağlantı; kaydedince yazı sayfasına gider (BlogEditForm gibi)
const Page = ({ onSubmit }) => {
  const navigate = useNavigate();
  return (
    <>
      <Link to="/blogs">Tüm yazılar</Link>
      <BlogForm
        submitLabel="Yayınla"
        onSubmit={async (values) => {
          await onSubmit(values);
          navigate("/blogs/b1");
        }}
      />
    </>
  );
};

const renderForm = (onSubmit = vi.fn().mockResolvedValue()) =>
  renderWithRouter([
    { path: "/new", element: <Page onSubmit={onSubmit} /> },
    { path: "/blogs", element: <p>Yazı listesi</p> },
    { path: "/blogs/b1", element: <p>Yazı sayfası</p> },
  ]);

describe("BlogForm cover image", () => {
  test("a non-https address is explained and not sent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    await fill(user, "http://example.com/kedi.jpg");
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(screen.getByText("Kapak görseli https:// ile başlayan bir adres olmalı.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("an https address is sent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);
    await fill(user, "https://example.com/kedi.jpg");
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image: "https://example.com/kedi.jpg" }));
  });
});

describe("BlogForm unsaved changes", () => {
  test("leaving an untouched form needs no confirmation", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("link", { name: "Tüm yazılar" }));
    expect(await screen.findByText("Yazı listesi")).toBeInTheDocument();
  });

  test("leaving with unsaved text asks first; staying keeps the text", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Başlık/), "Yarım kalan yazı");
    await user.click(screen.getByRole("link", { name: "Tüm yazılar" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Yazdıklarınız kaydedilmedi/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Sayfada kal" }));

    expect(screen.queryByText("Yazı listesi")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Başlık/)).toHaveValue("Yarım kalan yazı");
  });

  test("confirming leaves without saving", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Başlık/), "Vazgeçilen yazı");
    await user.click(screen.getByRole("link", { name: "Tüm yazılar" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Ayrıl, kaydetme" }));

    expect(await screen.findByText("Yazı listesi")).toBeInTheDocument();
  });

  test("saving and then moving on is not blocked", async () => {
    const user = userEvent.setup();
    renderForm();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(await screen.findByText("Yazı sayfası")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
