// src/components/PetRecommendations.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./PetRecommendations.css";

const PetRecommendations = ({ petId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/pets/${petId}/recommendations`);
        setRecommendations(data);
      } catch (err) {
        setError("Failed to fetch recommendations. Please try again later.");
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [petId]);

  if (loading) {
    return (
      <div className="loading-message">
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <h3>Özelleştirilmiş Tavsiyeler</h3>
      {recommendations.length > 0 ? (
        <ul className="recommendations-list">
          {recommendations.map((item, index) => (
            <li key={index} className="recommendation-item">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-recommendations">No recommendations available.</p>
      )}
    </div>
  );
};

export default PetRecommendations;
