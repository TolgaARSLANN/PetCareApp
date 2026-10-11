import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import Alert from "./ui/Alert";
import Field from "./ui/Field";
import { Spinner } from "./ui/Loading";
import { capitalizeTr, todayInputValue } from "../utils/format";

// Öneri sistemi bu değerlerle çalışır (backend/server/routes/pets.js)
const SPECIES_OPTIONS = ["kedi", "köpek", "kuş", "diğer"];

const PetForm = ({ selectedPet, onSaved, onCancel }) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nameRef = useRef(null);

  // Düzenleme modunda formu doldur ve ilk alana odaklan
  useEffect(() => {
    setName(selectedPet?.name || "");
    setSpecies((selectedPet?.species || "").toLocaleLowerCase("tr-TR"));
    setBirthDate(selectedPet?.birthDate?.split("T")[0] || "");
    setError("");
    nameRef.current?.focus();
  }, [selectedPet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = { name: name.trim(), species, birthDate };
      const { data } = selectedPet
        ? await API.put(`/pets/${selectedPet._id}`, payload)
        : await API.post("/pets", payload);
      onSaved(data, Boolean(selectedPet));
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const options = [...SPECIES_OPTIONS, ...(species && !SPECIES_OPTIONS.includes(species) ? [species] : [])];

  return (
    <form onSubmit={handleSubmit} className="card form-card" aria-labelledby="pet-form-title">
      <h2 id="pet-form-title" className="card-title">
        {selectedPet ? `${selectedPet.name} bilgilerini düzenle` : "Yeni evcil dost ekle"}
      </h2>
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-grid form-grid-3">
        <Field id="pet-name" label="Adı" required>
          <input
            ref={nameRef}
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="off"
          />
        </Field>
        <Field id="pet-species" label="Tür" required>
          <select className="input" value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="" disabled>
              Tür seçin
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {capitalizeTr(option)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pet-birth" label="Doğum tarihi" optional>
          <input
            type="date"
            className="input"
            value={birthDate}
            max={todayInputValue()}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Vazgeç
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <Spinner size={16} />}
          {selectedPet ? "Değişiklikleri kaydet" : "Evcil dostu ekle"}
        </button>
      </div>
    </form>
  );
};

export default PetForm;
