import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", { email, password });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      // Backend'in döndürdüğü mesajı göster (ör. e-posta kullanımda, parola çok kısa)
      const message = err.response?.data?.message;
      const translations = {
        "Email in use": "Bu e-posta adresi zaten kayıtlı.",
        "A valid email is required": "Geçerli bir e-posta adresi girin.",
        "Password must be at least 6 characters": "Parola en az 6 karakter olmalı.",
      };
      setError(translations[message] || "Kayıt başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="container">
      <h2>Üye Ol</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Parola
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Üye Ol
        </button>
      </form>
    </div>
  );
};

export default Register;
