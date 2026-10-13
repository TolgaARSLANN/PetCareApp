import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, useNavigate } from "react-router-dom";
import BlogForm from "./BlogForm";
import { prepareImage, ImageProcessingError } from "../utils/image";
import { renderWithRouter } from "../test/renderWithRouter";

// Tarayıcıdaki küçültme jsdom'da çalışmaz; sonucu taklit edilir (utils/image.test.js ayrıca sınar)
vi.mock("../utils/image", async (importOriginal) => ({ ...(await importOriginal()), prepareImage: vi.fn() }));

const SMALL_PHOTO = { dataUrl: "data:image/webp;base64,UklGRg==", width: 1600, height: 1200, size: 180000 };

const fill = async (user) => {
  await user.type(screen.getByLabelText(/Başlık/), "Başlık");
  await user.type(screen.getByLabelText(/İçerik/), "İçerik");
};

const choosePhoto = (user, name = "kedi.jpg") =>
  user.upload(screen.getByLabelText(/Kapak fotoğrafı/), new File(["x"], name, { type: "image/jpeg" }));

// Formun yanında başka sayfaya giden bir bağlantı; kaydedince yazı sayfasına gider (BlogEditForm gibi)
const Page = ({ onSubmit, initialValues, authorName = "Ayşe" }) => {
  const navigate = useNavigate();
  return (
    <>
      <Link to="/blogs">Tüm yazılar</Link>
      <BlogForm
        submitLabel="Yayınla"
        initialValues={initialValues}
        authorName={authorName}
        onSubmit={async (values) => {
          await onSubmit(values);
          navigate("/blogs/b1");
        }}
      />
    </>
  );
};

const renderForm = (onSubmit = vi.fn().mockResolvedValue(), initialValues, authorName) =>
  renderWithRouter([
    { path: "/new", element: <Page onSubmit={onSubmit} initialValues={initialValues} authorName={authorName} /> },
    { path: "/account", element: <p>Hesabım sayfası</p> },
    { path: "/blogs", element: <p>Yazı listesi</p> },
    { path: "/blogs/b1", element: <p>Yazı sayfası</p> },
  ]);

describe("BlogForm cover photo", () => {
  beforeEach(() => {
    vi.mocked(prepareImage).mockReset().mockResolvedValue(SMALL_PHOTO);
  });

  test("a chosen photo is prepared, previewed and sent with the post", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);
    await fill(user);
    await choosePhoto(user);

    expect(prepareImage).toHaveBeenCalledWith(expect.objectContaining({ name: "kedi.jpg" }));
    expect(screen.getByAltText("Kapak fotoğrafı önizlemesi")).toHaveAttribute("src", SMALL_PHOTO.dataUrl);
    expect(screen.getByText("Fotoğrafı değiştir")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Başlık",
      content: "İçerik",
      image: "",
      imageData: SMALL_PHOTO.dataUrl,
    });
  });

  test("without a photo nothing extra is sent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(onSubmit).toHaveBeenCalledWith({ title: "Başlık", content: "İçerik", image: "" });
  });

  test("an existing photo is kept unless removed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const existing = { title: "Başlık", content: "İçerik", image: "/api/images/abc" };
    renderForm(onSubmit, existing);

    expect(screen.getByAltText("Kapak fotoğrafı önizlemesi")).toHaveAttribute("src", "/api/images/abc");
    await user.click(screen.getByRole("button", { name: "Kaldır" }));
    expect(screen.queryByAltText("Kapak fotoğrafı önizlemesi")).not.toBeInTheDocument();
    expect(screen.getByText("Fotoğraf seç")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image: "" }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("imageData");
  });

  test("a file that cannot be used is explained at the field", async () => {
    const user = userEvent.setup();
    vi.mocked(prepareImage).mockRejectedValue(new ImageProcessingError("Bu fotoğraf açılamadı."));
    renderForm();
    await choosePhoto(user, "bozuk.jpg");

    expect(await screen.findByRole("alert")).toHaveTextContent("Bu fotoğraf açılamadı.");
    expect(screen.queryByAltText("Kapak fotoğrafı önizlemesi")).not.toBeInTheDocument();
  });

  test("a photo refused by the server is explained in Turkish", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ response: { status: 413, data: { error: "Image is too large" } } });
    renderForm(onSubmit);
    await fill(user);
    await choosePhoto(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));

    expect(await screen.findByText(/Fotoğraf çok büyük/)).toBeInTheDocument();
  });

  test.each([
    [429, "Too many photo uploads, please try again later", /Son bir saatte çok fazla fotoğraf/],
    [413, "Photo storage limit reached", /Fotoğraf alanınız doldu/],
  ])("the %s upload limit is explained in Turkish", async (status, error, text) => {
    const user = userEvent.setup();
    renderForm(vi.fn().mockRejectedValue({ response: { status, data: { error } } }));
    await fill(user);
    await choosePhoto(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  test("choosing a photo counts as an unsaved change", async () => {
    const user = userEvent.setup();
    renderForm();
    await choosePhoto(user);
    await user.click(screen.getByRole("link", { name: "Tüm yazılar" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
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

describe("BlogForm author", () => {
  test("the post is signed with the display name, which is shown but not typed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);
    expect(screen.getByText("Ayşe")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Yazar adı/)).not.toBeInTheDocument();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("author");
  });

  test("without a display name the form says where to set one and cannot be sent", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn(), undefined, null);
    expect(screen.getByRole("button", { name: "Yayınla" })).toBeDisabled();
    await user.click(screen.getByRole("link", { name: "Hesabım" }));
    expect(await screen.findByText("Hesabım sayfası")).toBeInTheDocument();
  });

  test("if the server still asks for a display name, the reason is explained", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn().mockRejectedValue({ response: { status: 409, data: { error: "Display name required" } } }));
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(await screen.findByText(/önce Hesabım sayfasından bir görünen ad belirleyin/)).toBeInTheDocument();
  });
});
