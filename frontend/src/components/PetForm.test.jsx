import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import API from "../services/api";
import PetForm from "./PetForm";
import { prepareImage } from "../utils/image";

vi.mock("../services/api", () => ({ default: { post: vi.fn(), put: vi.fn() } }));
// Tarayıcıdaki küçültme jsdom'da çalışmaz; sonucu taklit edilir (utils/image.test.js ayrıca sınar)
vi.mock("../utils/image", async (importOriginal) => ({ ...(await importOriginal()), prepareImage: vi.fn() }));

const SMALL_PHOTO = { dataUrl: "data:image/webp;base64,UklGRg==", width: 800, height: 800, size: 60000 };
const PAMUK = { _id: "p1", name: "Pamuk", species: "kedi" };

const renderForm = (selectedPet, onSaved = vi.fn()) => {
  render(<PetForm selectedPet={selectedPet} onSaved={onSaved} onCancel={vi.fn()} />);
  return onSaved;
};
const choosePhoto = (user) =>
  user.upload(screen.getByLabelText(/Fotoğrafı/), new File(["x"], "pamuk.jpg", { type: "image/jpeg" }));

describe("PetForm", () => {
  beforeEach(() => {
    vi.mocked(API.post).mockReset();
    vi.mocked(API.put).mockReset().mockResolvedValue({ data: PAMUK });
    vi.mocked(prepareImage).mockReset().mockResolvedValue(SMALL_PHOTO);
  });

  test("a name made only of spaces is not sent", async () => {
    const user = userEvent.setup();
    renderForm(PAMUK);

    const name = screen.getByLabelText(/Adı/);
    await user.clear(name);
    await user.type(name, "   ");
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));

    expect(screen.getByText("Lütfen evcil dostunuzun adını yazın.")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(API.put).not.toHaveBeenCalled();
  });

  test("a new pet can be added with a photo", async () => {
    const user = userEvent.setup();
    vi.mocked(API.post).mockResolvedValue({ data: { ...PAMUK, photo: "/api/images/abc" } });
    const onSaved = renderForm(null);
    await user.type(screen.getByLabelText(/Adı/), "Pamuk");
    await user.selectOptions(screen.getByLabelText(/Tür/), "kedi");
    await choosePhoto(user);

    expect(screen.getByAltText("Pamuk fotoğrafı önizlemesi")).toHaveAttribute("src", SMALL_PHOTO.dataUrl);
    await user.click(screen.getByRole("button", { name: "Evcil dostu ekle" }));

    expect(API.post).toHaveBeenCalledWith("/pets", {
      name: "Pamuk",
      species: "kedi",
      birthDate: "",
      photoData: SMALL_PHOTO.dataUrl,
    });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ photo: "/api/images/abc" }), false);
  });

  test("editing keeps the existing photo unless it is removed", async () => {
    const user = userEvent.setup();
    renderForm({ ...PAMUK, photo: "/api/images/abc" });
    expect(screen.getByAltText("Pamuk fotoğrafı önizlemesi")).toHaveAttribute("src", "/api/images/abc");

    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(API.put.mock.calls[0][1]).not.toHaveProperty("photo");
    expect(API.put.mock.calls[0][1]).not.toHaveProperty("photoData");
  });

  test("removing the existing photo asks the server to delete it", async () => {
    const user = userEvent.setup();
    renderForm({ ...PAMUK, photo: "/api/images/abc" });
    await user.click(screen.getByRole("button", { name: "Kaldır" }));
    expect(screen.queryByAltText(/fotoğrafı önizlemesi/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(API.put).toHaveBeenCalledWith("/pets/p1", expect.objectContaining({ photo: "" }));
  });

  test("a photo refused by the server is explained in Turkish", async () => {
    const user = userEvent.setup();
    vi.mocked(API.put).mockRejectedValue({ response: { status: 413, data: { error: "Photo storage limit reached" } } });
    renderForm(PAMUK);
    await choosePhoto(user);
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(await screen.findByText(/Fotoğraf alanınız doldu/)).toBeInTheDocument();
  });
});
