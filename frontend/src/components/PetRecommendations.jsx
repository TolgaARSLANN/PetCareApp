import React, { useEffect, useState } from "react";
import { CheckCircle, Lightbulb } from "@phosphor-icons/react";
import API from "../services/api";

const PetRecommendations = ({ petId, refreshKey }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await API.get(`/pets/${petId}/recommendations`);
        setRecommendations(data);
      } catch (err) {
        setError("Öneriler şu anda yüklenemedi.");
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [petId, refreshKey]);

  return (
    <section className="card recommendations" aria-labelledby="rec-title" aria-busy={loading}>
      <div className="section-card-head">
        <span className="icon-tile icon-tile-accent">
          <Lightbulb size={22} weight="duotone" aria-hidden="true" />
        </span>
        <div>
          <h2 id="rec-title" className="card-title">
            Size özel öneriler
          </h2>
          <p className="card-subtitle">Tür bilgisine ve eklediğiniz kayıtlara göre hazırlanır.</p>
        </div>
      </div>
      {loading ? (
        <div aria-hidden="true">
          <div className="skeleton skeleton-line" style={{ width: "90%" }} />
          <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        </div>
      ) : error ? (
        <p className="text-muted">{error}</p>
      ) : recommendations.length > 0 ? (
        <ul className="rec-list">
          {recommendations.map((item, index) => (
            <li key={index}>
              <CheckCircle size={20} weight="fill" className="rec-icon" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Şu an için bir öneri yok. Kayıt ekledikçe öneriler güncellenir.</p>
      )}
    </section>
  );
};

export default PetRecommendations;
