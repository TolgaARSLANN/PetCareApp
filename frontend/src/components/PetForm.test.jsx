import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import API from "../services/api";
import PetForm from "./PetForm";

vi.mock("../services/api", () => ({ default: { post: vi.fn(), put: vi.fn() } }));

describe("PetForm", () => {
  test("a name made only of spaces is not sent", async () => {
    const user = userEvent.setup();
    render(
      <PetForm selectedPet={{ _id: "p1", name: "Pamuk", species: "kedi" }} onSaved={vi.fn()} onCancel={vi.fn()} />
    );

    const name = screen.getByLabelText(/Adı/);
    await user.clear(name);
    await user.type(name, "   ");
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));

    expect(screen.getByText("Lütfen evcil dostunuzun adını yazın.")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(API.put).not.toHaveBeenCalled();
  });
});
