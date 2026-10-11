import React, { useEffect, useRef, useState } from "react";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import Field from "./ui/Field";
import { Spinner } from "./ui/Loading";
import { isHttpsUrl } from "../utils/validation";
import useUnsavedChanges from "../hooks/useUnsavedChanges";

const EMPTY = { title: "", content: "", author: "", image: "" };

// Yeni yazı ve düzenleme için ortak form. Kaydetme işini onSubmit yapar; hata fırlatırsa mesaj gösterilir.
const BlogForm = ({ initialValues = EMPTY, submitLabel, onSubmit, onCancel, autoFocus = true }) => {
  const [initial] = useState(() => ({ ...EMPTY, ...initialValues }));
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  // Yazılanlar kaybolmasın: değişiklik varken sayfadan ayrılmadan önce sorulur
  const dirty = Object.keys(EMPTY).some((key) => values[key] !== initial[key]);
  const { blocker, allowLeave } = useUnsavedChanges(dirty);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = {
      title: values.title.trim(),
      content: values.content.trim(),
      author: values.author.trim(),
      image: values.image.trim(),
    };
    if (!trimmed.title || !trimmed.content || !trimmed.author) {
      setError("Başlık, içerik ve yazar alanları zorunludur.");
      return;
    }
    if (trimmed.image && !isHttpsUrl(trimmed.image)) {
      setError("Kapak görseli https:// ile başlayan bir adres olmalı.");
      return;
    }
    setBusy(true);
    setError("");
    // Kaydettikten sonraki yönlendirme (ör. yazı sayfasına) engellenmesin
    allowLeave();
    try {
      await onSubmit(trimmed);
    } catch (err) {
      allowLeave(false);
      console.error(err);
      setError("Yazı kaydedilemedi. Lütfen tekrar deneyin.");
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
        <div className="form-grid form-grid-2">
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
          <Field
            id="blog-image"
            label="Kapak görseli bağlantısı"
            hint="https:// ile başlayan bir görsel adresi."
            optional
          >
            <input
              type="url"
              className="input"
              value={values.image}
              onChange={set("image")}
              placeholder="https://"
              maxLength={500}
            />
          </Field>
        </div>
        <div className="form-actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
              Vazgeç
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
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
