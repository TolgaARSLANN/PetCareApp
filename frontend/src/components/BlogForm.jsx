import React, { useEffect, useRef, useState } from "react";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import Field from "./ui/Field";
import PhotoPicker from "./ui/PhotoPicker";
import { Spinner } from "./ui/Loading";
import { photoErrorMessage } from "../utils/photoErrors";
import useUnsavedChanges from "../hooks/useUnsavedChanges";

const EMPTY = { title: "", content: "", author: "", image: "" };

// Yeni yazı ve düzenleme için ortak form. Kaydetme işini onSubmit yapar; hata fırlatırsa mesaj gösterilir.
// Kapak fotoğrafı: values.image mevcut fotoğrafın adresi, photo yeni seçilen ve küçültülmüş fotoğraf.
const BlogForm = ({ initialValues = EMPTY, submitLabel, onSubmit, onCancel, autoFocus = true }) => {
  const [initial] = useState(() => ({ ...EMPTY, ...initialValues }));
  const [values, setValues] = useState(initial);
  const [photo, setPhoto] = useState(null); // { dataUrl, size }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  // Yazılanlar kaybolmasın: değişiklik varken sayfadan ayrılmadan önce sorulur
  const dirty = Boolean(photo) || Object.keys(EMPTY).some((key) => values[key] !== initial[key]);
  const { blocker, allowLeave } = useUnsavedChanges(dirty);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const removePhoto = () => {
    setPhoto(null);
    setValues((v) => ({ ...v, image: "" }));
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
      setError(photoErrorMessage(err) || "Yazı kaydedilemedi. Lütfen tekrar deneyin.");
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

        <PhotoPicker
          label="Kapak fotoğrafı"
          previewAlt="Kapak fotoğrafı önizlemesi"
          currentUrl={values.image}
          newPhoto={photo}
          onSelect={setPhoto}
          onRemove={removePhoto}
          onBusyChange={setPhotoBusy}
          disabled={busy}
        />

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
