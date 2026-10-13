import React, { useEffect, useState } from "react";
import { DeviceMobile, DownloadSimple, IdentificationCard, Key, SignOut, Trash, UserCircle } from "@phosphor-icons/react";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import Field from "./ui/Field";
import PasswordInput from "./ui/PasswordInput";
import { PageLoader, Spinner } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { todayInputValue } from "../utils/format";
import { DISPLAY_NAME_ERRORS, DISPLAY_NAME_HINT, DISPLAY_NAME_MAX } from "../utils/displayName";
import { isPasswordTooLong, PASSWORD_TOO_LONG } from "../utils/validation";

const MIN_PASSWORD_LENGTH = 6;

// Backend mesajlarının Türkçesi
const PASSWORD_ERRORS = {
  "Current password is incorrect": "Mevcut parola hatalı.",
  "New password must be different": "Yeni parola mevcut paroladan farklı olmalı.",
  "Password must be at least 6 characters": "Yeni parola en az 6 karakter olmalı.",
  "Password must be at most 72 bytes": PASSWORD_TOO_LONG,
};

const errorMessage = (err, translations, fallback) => {
  if (err.response?.status === 429) {
    return "Çok fazla başarısız deneme yapıldı. Güvenliğiniz için lütfen 15 dakika sonra tekrar deneyin.";
  }
  return translations[err.response?.data?.message] || (err.response ? fallback : "Sunucuya ulaşılamadı.");
};

// Görünen ad: blog yazılarında yazar olarak görünür. Değişince sunucu mevcut yazıları da günceller.
// Bu özellikten önce açılan hesaplarda henüz yoktur; o zamana kadar yeni yazı yayınlanamaz.
const DisplayName = ({ initialName }) => {
  const { setDisplayName } = useAuth();
  const [saved, setSaved] = useState(initialName || "");
  const [name, setName] = useState(initialName || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const { data } = await API.put("/auth/display-name", { displayName: name });
      setSaved(data.displayName);
      setName(data.displayName);
      setDisplayName(data.displayName);
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err, DISPLAY_NAME_ERRORS, "Görünen ad kaydedilemedi. Lütfen tekrar deneyin."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card form-card" aria-labelledby="display-name-title">
      <div className="section-card-head">
        <span className="icon-tile">
          <IdentificationCard size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id="display-name-title" className="card-title">
          Görünen ad
        </h2>
      </div>
      <p className="text-muted">
        {saved
          ? "Blog yazılarınızda yazar olarak bu ad görünür. Değiştirdiğinizde mevcut yazılarınızda da güncellenir."
          : "Henüz bir görünen adınız yok. Blog yazısı yayınlamak için bir ad belirleyin; mevcut yazılarınızda da bu ad görünür."}
      </p>
      {success && (
        <Alert type="success" onClose={() => setSuccess(false)}>
          Görünen adınız kaydedildi.
        </Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}
      <form className="form-stack" onSubmit={handleSubmit}>
        <Field id="display-name" label="Görünen ad" hint={DISPLAY_NAME_HINT} required>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            maxLength={DISPLAY_NAME_MAX}
          />
        </Field>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy || name.trim() === saved}>
            {busy && <Spinner size={16} />}
            Kaydet
          </button>
        </div>
      </form>
    </section>
  );
};

const ChangePassword = () => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touchedRepeat, setTouchedRepeat] = useState(false);

  const mismatch = touchedRepeat && repeat !== "" && repeat !== next;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedRepeat(true);
    if (next !== repeat) return;
    if (isPasswordTooLong(next)) {
      setError(PASSWORD_TOO_LONG);
      setSuccess(false);
      return;
    }
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await API.put("/auth/password", { currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setRepeat("");
      setTouchedRepeat(false);
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err, PASSWORD_ERRORS, "Parola değiştirilemedi. Lütfen tekrar deneyin."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card form-card" aria-labelledby="password-title">
      <div className="section-card-head">
        <span className="icon-tile">
          <Key size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id="password-title" className="card-title">
          Parolayı değiştir
        </h2>
      </div>
      {success && (
        <Alert type="success" onClose={() => setSuccess(false)}>
          Parolanız değiştirildi. Diğer cihazlardaki oturumlarınız kapatıldı.
        </Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}
      <form className="form-stack" onSubmit={handleSubmit}>
        <Field id="current-password" label="Mevcut parola" required>
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="form-grid form-grid-2">
          <Field id="new-password" label="Yeni parola" hint={`En az ${MIN_PASSWORD_LENGTH} karakter.`} required>
            <PasswordInput
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
            />
          </Field>
          <div className="field">
            <Field id="repeat-password" label="Yeni parola (tekrar)" required>
              <PasswordInput
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                onBlur={() => setTouchedRepeat(true)}
                autoComplete="new-password"
                aria-invalid={mismatch || undefined}
                aria-describedby={mismatch ? "repeat-password-error" : undefined}
              />
            </Field>
            {mismatch && (
              <p id="repeat-password-error" className="field-error" role="alert">
                Parolalar eşleşmiyor.
              </p>
            )}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner size={16} />}
            Parolayı değiştir
          </button>
        </div>
      </form>
    </section>
  );
};

// Verilerimi indir: hesabın tüm verileri tek bir JSON dosyası (KVKK/GDPR veri taşınabilirliği)
const ExportData = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await API.get("/auth/account/export", { responseType: "blob" });
      // Dosya adında kullanıcının yerel tarihi (sunucununki UTC'dir; gece yarısından sonra bir gün geride kalır)
      const fileName = `pawfect-care-verilerim-${todayInputValue()}.json`;
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Verileriniz indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card form-card" aria-labelledby="export-title">
      <div className="section-card-head">
        <span className="icon-tile">
          <DownloadSimple size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id="export-title" className="card-title">
          Verilerim
        </h2>
      </div>
      <p className="text-muted">
        Hesap bilginizi, evcil dostlarınızı (sağlık, aşı, kilo, ilaç, randevu ve acil durum kayıtlarıyla) ve blog
        yazılarınızı tek bir dosya (JSON) olarak indirin. Hesabınızı silmeden önce bir kopyasını almak için de
        kullanabilirsiniz.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={download} disabled={busy}>
          {busy ? <Spinner size={16} /> : <DownloadSimple size={18} aria-hidden="true" />}
          Verilerimi indir
        </button>
      </div>
    </section>
  );
};

// Kayıp ya da ortak kullanılan bir cihaz için: hesaba açılmış tüm oturumları (bu cihaz dahil) kapatır
const SignOutEverywhere = () => {
  const { endSession } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirmSignOut = async () => {
    setBusy(true);
    try {
      await API.post("/auth/logout-all");
      // Yönlendirmeyi RequireAuth yapar: giriş sayfası nedeni açıklar
      endSession("signedOutEverywhere");
    } catch (err) {
      setConfirming(false);
      setError(errorMessage(err, {}, "Oturumlar kapatılamadı. Lütfen tekrar deneyin."));
      setBusy(false);
    }
  };

  return (
    <section className="card form-card" aria-labelledby="sessions-title">
      <div className="section-card-head">
        <span className="icon-tile">
          <DeviceMobile size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id="sessions-title" className="card-title">
          Oturumlar
        </h2>
      </div>
      <p className="text-muted">
        Hesabınıza başka bir cihazdan, örneğin kaybolan bir telefondan ya da ortak bir bilgisayardan giriş yapılmış
        olabilir. Tüm cihazlardan çıkış yaptığınızda bu cihaz dahil her yerde yeniden giriş yapmanız gerekir.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setError("");
            setConfirming(true);
          }}
        >
          <SignOut size={18} aria-hidden="true" />
          Tüm cihazlardan çıkış yap
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Tüm cihazlardan çıkılsın mı?"
        message="Bu cihaz dahil, hesabınıza açık tüm oturumlar kapatılacak."
        confirmLabel="Evet, çıkış yap"
        busy={busy}
        onConfirm={confirmSignOut}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
};

const DeleteAccount = ({ petCount, blogCount }) => {
  const { endSession } = useAuth();
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openConfirm = (e) => {
    e.preventDefault();
    setError("");
    setConfirming(true);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await API.delete("/auth/account", { data: { password } });
      // Yönlendirmeyi bu sayfanın giriş koruması (RequireAuth) yapar: neden "accountDeleted"
      // olduğu için kullanıcıyı giriş sayfasına değil, mesajla ana sayfaya gönderir
      endSession("accountDeleted");
    } catch (err) {
      setConfirming(false);
      setError(
        errorMessage(err, { "Password is incorrect": "Parola hatalı." }, "Hesap silinemedi. Lütfen tekrar deneyin.")
      );
      setBusy(false);
    }
  };

  const summary = [
    `${petCount} evcil dostunuz (tüm sağlık, aşı, kilo, ilaç, randevu ve acil durum kayıtlarıyla)`,
    `${blogCount} blog yazınız`,
  ];

  return (
    <section className="card form-card danger-zone" aria-labelledby="delete-title">
      <div className="section-card-head">
        <span className="icon-tile icon-tile-danger">
          <Trash size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id="delete-title" className="card-title">
          Hesabı sil
        </h2>
      </div>
      <div className="danger-text">
        <p>Hesabınızı sildiğinizde aşağıdakiler kalıcı olarak silinir:</p>
        <ul>
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>
          <strong>Bu işlem geri alınamaz.</strong>
        </p>
      </div>
      <form className="form-stack" onSubmit={openConfirm}>
        <Field id="delete-password" label="Onay için parolanız" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? "delete-error" : undefined}
          />
        </Field>
        {error && (
          <p id="delete-error" className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-danger">
            <Trash size={18} aria-hidden="true" />
            Hesabımı sil
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        title="Hesabınız silinsin mi?"
        message={`Hesabınız, ${summary.join(" ve ")} kalıcı olarak silinecek.`}
        confirmLabel="Evet, hesabımı sil"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
};

const Account = () => {
  useDocumentTitle("Hesabım");
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/auth/account")
      .then(({ data }) => setAccount(data))
      .catch(() => setError("Hesap bilgileri yüklenemedi. Lütfen sayfayı yenileyin."));
  }, []);

  if (!account && !error) return <PageLoader label="Hesap bilgileri yükleniyor" />;

  return (
    <div className="container container-narrow page account-page">
      <header className="page-header">
        <div className="account-heading">
          <span className="avatar">
            <UserCircle size={32} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h1 className="page-title">Hesabım</h1>
            {account && <p className="page-subtitle">{account.email}</p>}
          </div>
        </div>
      </header>
      {error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          <DisplayName initialName={account.displayName} />
          <ChangePassword />
          <SignOutEverywhere />
          <ExportData />
          <DeleteAccount petCount={account.petCount} blogCount={account.blogCount} />
        </>
      )}
    </div>
  );
};

export default Account;
