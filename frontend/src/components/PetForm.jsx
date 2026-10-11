import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./PetForm.css";

// Öneri sistemi bu değerlerle çalışır (backend/server/routes/pets.js)
const SPECIES_OPTIONS = ["kedi", "köpek", "kuş", "diğer"];


const PetForm = ({ selectedPet, setSelectedPet, setPets, pets }) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");

  // Formu doldur
  useEffect(() => {
    if (selectedPet) {
      setName(selectedPet.name);
      setSpecies((selectedPet.species || "").toLocaleLowerCase("tr-TR"));
      setBirthDate(selectedPet.birthDate?.split("T")[0] || "");
    } else {
      setName("");
      setSpecies("");
      setBirthDate("");
    }
  }, [selectedPet]);

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (selectedPet) {
        // Güncelleme
        const { data } = await API.put(`/pets/${selectedPet._id}`, {
          name,
          species,
          birthDate,
        });
        setPets(
          pets.map((pet) =>
            pet._id === selectedPet._id ? data : pet
          )
        );
      } else {
        // Yeni pet ekleme
        const { data } = await API.post("/pets", {
          name,
          species,
          birthDate,
        });
        setPets([...pets, data]);
      }
      setSelectedPet(null);
      setName("");
      setSpecies("");
      setBirthDate("");
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h3>{selectedPet ? "Evcil Dost Düzenle" : "Evcil Dost Ekle"}</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Adı
        </label>
        <input
          type="text"
          className="form-control"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="species" className="form-label">
          Tür
        </label>
        <select
          className="form-select"
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          required
        >
          <option value="" disabled>
            Tür seçin
          </option>
          {/* Eski kayıtlarda listede olmayan bir tür varsa onu da göster */}
          {[...SPECIES_OPTIONS, ...(species && !SPECIES_OPTIONS.includes(species) ? [species] : [])].map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toLocaleUpperCase("tr-TR") + option.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="birthDate" className="form-label">
          Doğum Tarihi
        </label>
        <input
          type="date"
          className="form-control"
          id="birthDate"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {selectedPet ? "Güncelle" : "Ekle"}
      </button>
      {selectedPet && (
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => setSelectedPet(null)}
        >
          İptal
        </button>
      )}
    </form>
  );
};

export default PetForm;
