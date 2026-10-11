import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirstAidKit } from "@phosphor-icons/react";
import RecordSection from "./RecordSection";
import Field from "./ui/Field";

const RECORDS = [
  { _id: "r1", date: "2026-09-02", notes: "Hafif iştahsızlık" },
  { _id: "r2", date: "2026-03-10", notes: "Genel kontrol" },
];

const renderSection = (api = {}, records = RECORDS) => {
  const fullApi = {
    add: vi.fn().mockResolvedValue(),
    update: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    ...api,
  };
  render(
    <RecordSection
      id="health"
      icon={FirstAidKit}
      title="Sağlık kayıtları"
      emptyText="Henüz sağlık kaydı yok."
      addLabel="Kaydı ekle"
      records={records}
      itemLabel={(r) => `${r.date} tarihli sağlık`}
      initialValues={{ date: "2026-10-11", notes: "" }}
      toFormValues={(r) => ({ date: r.date, notes: r.notes })}
      api={fullApi}
      renderFields={(v, set) => (
        <Field id="health-notes" label="Not" required>
          <textarea className="input" value={v.notes} onChange={set("notes")} />
        </Field>
      )}
      renderRecord={(r) => <p>{r.notes}</p>}
    />
  );
  return fullApi;
};

describe("RecordSection", () => {
  test("lists records with a count", () => {
    renderSection();
    expect(screen.getByText("Hafif iştahsızlık")).toBeInTheDocument();
    expect(screen.getByLabelText("2 kayıt")).toHaveTextContent("2");
  });

  test("shows the empty state when there are no records", () => {
    renderSection({}, []);
    expect(screen.getByText("Henüz sağlık kaydı yok.")).toBeInTheDocument();
  });

  test("edits a record in place", async () => {
    const user = userEvent.setup();
    const api = renderSection();

    await user.click(screen.getByRole("button", { name: "2026-09-02 tarihli sağlık kaydını düzenle" }));
    const notes = screen.getByLabelText(/Not/);
    expect(notes).toHaveValue("Hafif iştahsızlık");
    expect(notes).toHaveFocus();

    await user.clear(notes);
    await user.type(notes, "Düzeldi");
    await user.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));

    expect(api.update).toHaveBeenCalledWith("r1", { date: "2026-09-02", notes: "Düzeldi" });
    expect(await screen.findByText("Kayıt güncellendi.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Değişiklikleri kaydet" })).not.toBeInTheDocument();
  });

  test("cancelling an edit does not save", async () => {
    const user = userEvent.setup();
    const api = renderSection();

    await user.click(screen.getByRole("button", { name: "2026-03-10 tarihli sağlık kaydını düzenle" }));
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(api.update).not.toHaveBeenCalled();
    expect(screen.getByText("Genel kontrol")).toBeInTheDocument();
  });

  test("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    const api = renderSection();

    await user.click(screen.getByRole("button", { name: "2026-03-10 tarihli sağlık kaydını sil" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("2026-03-10 tarihli sağlık kaydı kalıcı olarak silinecek");
    expect(api.remove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Evet, sil" }));
    expect(api.remove).toHaveBeenCalledWith("r2");
    expect(await screen.findByText("Kayıt silindi.")).toBeInTheDocument();
  });

  test("keeps the form open and shows an error when saving fails", async () => {
    const user = userEvent.setup();
    renderSection({ add: vi.fn().mockRejectedValue({ response: { status: 400 } }) });

    await user.click(screen.getByRole("button", { name: "Sağlık kayıtları: yeni kayıt ekle" }));
    await user.type(screen.getByLabelText(/Not/), "Yeni not");
    await user.click(screen.getByRole("button", { name: "Kaydı ekle" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Zorunlu alanları doldurup tekrar deneyin.");
    expect(screen.getByLabelText(/Not/)).toHaveValue("Yeni not");
  });

  test("is read-only without an api", () => {
    render(
      <RecordSection
        id="vaccines"
        icon={FirstAidKit}
        title="Aşılar"
        records={[{ _id: "v1", vaccineName: "Kuduz" }]}
        renderRecord={(v) => <span>{v.vaccineName}</span>}
      />
    );
    expect(screen.getByText("Kuduz")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
