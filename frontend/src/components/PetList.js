import React, { useState, useEffect } from "react";
import API from "../services/api";
import PetForm from "./PetForm";
import { Link } from "react-router-dom";
import "./PetList.css";

const PetList = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  // Pet listesini yükle
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data } = await API.get("/pets");
        setPets(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPets();
  }, []);

  // Pet silme işlemi
  const handleDelete = async (id) => {
    try {
      await API.delete(`/pets/${id}`);
      setPets(pets.filter((pet) => pet._id !== id)); // Listeden kaldır
      alert("Pet deleted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h2>Evcil Dostlarım</h2>
      <PetForm
        selectedPet={selectedPet}
        setSelectedPet={setSelectedPet}
        setPets={setPets}
        pets={pets}
      />
      <div className="grid mt-4">
        {pets.map((pet) => (
          <div key={pet._id} className="grid-item">
            <div>
              <strong>{pet.name}</strong> - {pet.species}
            </div>
            <div className="grid-item-buttons">
              <Link
                to={`/pets/${pet._id}`}
                className="btn btn-info btn-sm"
              >
                Detay
              </Link>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => setSelectedPet(pet)}
              >
                Düzenle
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(pet._id)}
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetList;
