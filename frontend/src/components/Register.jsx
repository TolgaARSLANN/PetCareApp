import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import { DISPLAY_NAME_ERRORS, DISPLAY_NAME_HINT, DISPLAY_NAME_MAX } from "../utils/displayName";
import { isPasswordTooLong, PASSWORD_TOO_LONG } from "../utils/validation";
import AuthShell from "./AuthShell";
import Alert from "./ui/Alert";
import Field from "./ui/Field";
import PasswordInput from "./ui/PasswordInput";
import { Spinner } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Backend'in döndürdüğü mesajların Türkçesi
const ERROR_TRANSLATIONS = {
  ...DISPLAY_NAME_ERRORS,
  "Email in use": "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.",
  "A valid email is required": "Geçerli bir e-posta adresi girin.",
  "Password must be at least 6 characters": "Parola en az 6 karakter olmalı.",
  "Password must be at most 72 bytes": PASSWORD_TOO_LONG,
  "Terms must be accepted": "Üye olmak için Kullanım Koşulları'nı kabul etmeniz gerekir.",
  "Too many attempts, please try again later":
    "Çok fazla başarısız deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
};

const Register = () => {
  useDocumentTitle("Üye ol");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  // Uyarı, kullanıcı tekrar alanından çıkınca ya da formu gönderince gösterilir (yazarken değil)
  const [touchedRepeat, setTouchedRepeat] = useState(false);
  const repeatRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const mismatch = touchedRepeat && repeat !== "" && repeat !== password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedRepeat(true);
    // Henüz "Şifremi unuttum" yok: yanlış yazılan bir parola hesabın kaybı demek
    if (repeat !== password) {
      repeatRef.current?.focus();
      return;
    }
    if (isPasswordTooLong(password)) {
      setError(PASSWORD_TOO_LONG);
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Sunucu kayıtla birlikte oturumu da başlatır; giriş formuna gerek kalmaz.
      // Yönlendirmeyi GuestOnly yapar (oturum açılınca /pets'e gider).
      const { data } = await API.post("/auth/register", { displayName, email, password, acceptTerms });
      login(data.userId, data.displayName);
    } catch (err) {
      const message = err.response?.data?.message;
      setError(
        ERROR_TRANSLATIONS[message] ||
          (err.response
            ? "Kayıt tamamlanamadı. Lütfen tekrar deneyin."
            : "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.")
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
        <Field id="display-name" label="Görünen ad" hint={DISPLAY_NAME_HINT} required>
          <input
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            maxLength={DISPLAY_NAME_MAX}
          />
        </Field>
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
        <div className="field">
          <Field id="password-repeat" label="Parola (tekrar)" required>
            <PasswordInput
              ref={repeatRef}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              onBlur={() => setTouchedRepeat(true)}
              autoComplete="new-password"
              aria-invalid={mismatch || undefined}
              aria-describedby={mismatch ? "password-repeat-error" : undefined}
            />
          </Field>
          {mismatch && (
            <p id="password-repeat-error" className="field-error" role="alert">
              Parolalar eşleşmiyor.
            </p>
          )}
        </div>
        <div className="field">
          <label className="check">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              aria-describedby="privacy-note"
            />
            <span>
              <Link to="/terms" target="_blank" rel="noopener">
                Kullanım Koşulları
              </Link>
              'nı kabul ediyorum.
            </span>
          </label>
          {/* Aydınlatma bir onay değil, bilgilendirmedir (KVKK m. 10): ayrı bir cümleyle gösterilir */}
          <p id="privacy-note" className="field-hint">
            Kişisel verilerinizin nasıl işlendiğini{" "}
            <Link to="/privacy" target="_blank" rel="noopener">
              Gizlilik ve Aydınlatma Metni
            </Link>
            'nde bulabilirsiniz.
          </p>
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy && <Spinner size={18} />}
          {busy ? "Hesap oluşturuluyor…" : "Üye ol"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
