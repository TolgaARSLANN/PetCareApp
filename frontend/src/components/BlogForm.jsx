import React, { useEffect, useId, useRef, useState } from "react";
import { ImageSquare, Trash } from "@phosphor-icons/react";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import Field from "./ui/Field";
import { Spinner } from "./ui/Loading";
import { prepareImage } from "../utils/image";
import useUnsavedChanges from "../hooks/useUnsavedChanges";

const EMPTY = { title: "", content: "", author: "", image: "" };

// Sunucunun fotoğraf hatalarının Türkçesi (backend/server/services/images.js)
const IMAGE_ERRORS = {
  "Image is too large": "Fotoğraf çok büyük. Lütfen başka bir fotoğraf deneyin.",
  "Only JPEG, PNG and WebP images are accepted": "Yalnızca JPEG, PNG ve WebP fotoğraflar kabul edilir.",
  "Image content does not match its type": "Bu dosya bir fotoğraf gibi görünmüyor.",
  "Image could not be read": "Bu fotoğraf okunamadı. Lütfen başka bir fotoğraf deneyin.",
  "Image dimensions are too large": "Fotoğrafın ölçüleri çok büyük (en fazla 4096 piksel).",
  "Too many photo uploads, please try again later":
    "Son bir saatte çok fazla fotoğraf yüklediniz. Lütfen biraz sonra tekrar deneyin ya da yazıyı fotoğrafsız yayınlayın.",
  "Photo storage limit reached":
    "Fotoğraf alanınız doldu (en fazla 25 MB). Eski yazılarınızdaki fotoğrafları kaldırarak yer açabilirsiniz.",
};

// Yeni yazı ve düzenleme için ortak form. Kaydetme işini onSubmit yapar; hata fırlatırsa mesaj gösterilir.
// Kapak fotoğrafı: values.image mevcut fotoğrafın adresi, photo yeni seçilen ve küçültülmüş fotoğraf.
const BlogForm = ({ initialValues = EMPTY, submitLabel, onSubmit, onCancel, autoFocus = true }) => {
  const [initial] = useState(() => ({ ...EMPTY, ...initialValues }));
  const [values, setValues] = useState(initial);
  const [photo, setPhoto] = useState(null); // { dataUrl, size }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);
  const photoId = useId();

  // Yazılanlar kaybolmasın: değişiklik varken sayfadan ayrılmadan önce sorulur
  const dirty = Boolean(photo) || Object.keys(EMPTY).some((key) => values[key] !== initial[key]);
  const { blocker, allowLeave } = useUnsavedChanges(dirty);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const preview = photo?.dataUrl || values.image;

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosya yeniden seçilebilsin
    if (!file) return;
    setPhotoError("");
    setPhotoBusy(true);
    try {
      setPhoto(await prepareImage(file));
    } catch (err) {
      console.error(err);
      setPhotoError(err.name === "ImageProcessingError" ? err.message : "Fotoğraf hazırlanamadı.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setValues((v) => ({ ...v, image: "" }));
    setPhotoError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = {
      title: values.title.trim(),
      content: values.content.trim(),
      author: values.author.trim(),
      image: values.image,
    };
    if (!trimmed.title || !trimmed.content || !trimmed.author) {
      setError("Başlık, içerik ve yazar alanları zorunludur.");
      return;
    }
    setBusy(true);
    setError("");
    // Kaydettikten sonraki yönlendirme (ör. yazı sayfasına) engellenmesin
    allowLeave();
    try {
      await onSubmit(photo ? { ...trimmed, imageData: photo.dataUrl } : trimmed);
    } catch (err) {
      allowLeave(false);
      console.error(err);
      setError(IMAGE_ERRORS[err.response?.data?.error] || "Yazı kaydedilemedi. Lütfen tekrar deneyin.");
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="form-stack">
        {error && <Alert type="error">{error}</Alert>}
        <Field id="blog-title" label="Başlık" required>
          <input
            ref={titleRef}
            type="text"
            className="input"
            value={values.title}
            onChange={set("title")}
            maxLength={120}
          />
        </Field>
        <Field id="blog-content" label="İçerik" hint="Paragrafları boş satırla ayırabilirsiniz." required>
          <textarea className="input" rows={8} value={values.content} onChange={set("content")} maxLength={20000} />
        </Field>
        <Field id="blog-author" label="Yazar adı" hint="Yazının altında görünecek isim." required>
          <input
            type="text"
            className="input"
            value={values.author}
            onChange={set("author")}
            autoComplete="name"
            maxLength={60}
          />
        </Field>

        <div className="field">
          <span className="field-label" id={`${photoId}-label`}>
            Kapak fotoğrafı <span className="field-optional">(isteğe bağlı)</span>
          </span>
          {preview && (
            <div className="photo-preview">
              <img src={preview} alt="Kapak fotoğrafı önizlemesi" />
            </div>
          )}
          <div className="photo-actions">
            {/* Gerçek dosya seçici gizli ama odaklanabilir; görünen düğme onun etiketi */}
            <input
              id={photoId}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={choosePhoto}
              disabled={photoBusy || busy}
              aria-labelledby={`${photoId}-label ${photoId}-button`}
              aria-describedby={`${photoId}-hint${photoError ? ` ${photoId}-error` : ""}`}
            />
            <label htmlFor={photoId} id={`${photoId}-button`} className="btn btn-secondary btn-sm">
              {photoBusy ? <Spinner size={16} /> : <ImageSquare size={18} aria-hidden="true" />}
              {photoBusy ? "Hazırlanıyor…" : preview ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
            </label>
            {preview && !photoBusy && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto} disabled={busy}>
                <Trash size={18} aria-hidden="true" />
                Kaldır
              </button>
            )}
          </div>
          <p className="field-hint" id={`${photoId}-hint`}>
            JPEG, PNG ya da WebP. Fotoğraf gönderilmeden önce küçültülür ve içindeki konum bilgisi silinir.
          </p>
          {photoError && (
            <p className="field-error" id={`${photoId}-error`} role="alert">
              {photoError}
            </p>
          )}
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
              Vazgeç
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy || photoBusy}>
            {busy && <Spinner size={16} />}
            {submitLabel}
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Değişiklikler kaydedilmedi"
        message="Yazdıklarınız kaydedilmedi. Sayfadan ayrılırsanız kaybolacak."
        confirmLabel="Ayrıl, kaydetme"
        cancelLabel="Sayfada kal"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </>
  );
};

export default BlogForm;
