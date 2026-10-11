import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import { isPasswordTooLong, PASSWORD_TOO_LONG } from "../utils/validation";
import AuthShell from "./AuthShell";
import Alert from "./ui/Alert";
import Field from "./ui/Field";
import PasswordInput from "./ui/PasswordInput";
import { Spinner } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Backend'in döndürdüğü mesajların Türkçesi
const ERROR_TRANSLATIONS = {
  "Email in use": "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.",
  "A valid email is required": "Geçerli bir e-posta adresi girin.",
  "Password must be at least 6 characters": "Parola en az 6 karakter olmalı.",
  "Password must be at most 72 bytes": PASSWORD_TOO_LONG,
  "Too many attempts, please try again later":
    "Çok fazla başarısız deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
};

const Register = () => {
  useDocumentTitle("Üye ol");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPasswordTooLong(password)) {
      setError(PASSWORD_TOO_LONG);
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Sunucu kayıtla birlikte oturumu da başlatır; giriş formuna gerek kalmaz.
      // Yönlendirmeyi GuestOnly yapar (oturum açılınca /pets'e gider).
      const { data } = await API.post("/auth/register", { email, password });
      login(data.userId);
    } catch (err) {
      const message = err.response?.data?.message;
      setError(
        ERROR_TRANSLATIONS[message] ||
          (err.response ? "Kayıt tamamlanamadı. Lütfen tekrar deneyin." : "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.")
      );
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Hesap oluşturun"
      subtitle="Ücretsiz üye olun, evcil dostlarınızın sağlık defterini hemen başlatın."
      footer={
        <>
          Zaten üye misiniz? <Link to="/login">Giriş yapın</Link>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} className="form-stack">
        <Field id="email" label="E-posta" required>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </Field>
        <Field id="password" label="Parola" hint="En az 6 karakter." required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy && <Spinner size={18} />}
          {busy ? "Hesap oluşturuluyor…" : "Üye ol"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
