import React, { useId, useState } from "react";
import { ImageSquare, Trash } from "@phosphor-icons/react";
import { Spinner } from "./Loading";
import { prepareImage } from "../../utils/image";

// Fotoğraf seçici (blog kapak fotoğrafı, evcil dost fotoğrafı). Seçilen fotoğraf tarayıcıda hazırlanır
// (küçültülür, döndürülür, konum bilgisi silinir; utils/image.js) ve onSelect ile forma verilir.
// currentUrl: kayıtlı fotoğrafın adresi; newPhoto: seçilen ama henüz kaydedilmemiş fotoğraf.
const PhotoPicker = ({
  label,
  currentUrl,
  newPhoto,
  onSelect,
  onRemove,
  onBusyChange,
  disabled = false,
  previewAlt = "Fotoğraf önizlemesi",
  round = false,
}) => {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = newPhoto?.dataUrl || currentUrl;

  const setBusyState = (value) => {
    setBusy(value);
    onBusyChange?.(value);
  };

  const choose = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosya yeniden seçilebilsin
    if (!file) return;
    setError("");
    setBusyState(true);
    try {
      onSelect(await prepareImage(file));
    } catch (err) {
      console.error(err);
      setError(err.name === "ImageProcessingError" ? err.message : "Fotoğraf hazırlanamadı.");
    } finally {
      setBusyState(false);
    }
  };

  const remove = () => {
    setError("");
    onRemove();
  };

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>
        {label} <span className="field-optional">(isteğe bağlı)</span>
      </span>
      {preview && (
        <div className={`photo-preview ${round ? "photo-preview-round" : ""}`}>
          <img src={preview} alt={previewAlt} />
        </div>
      )}
      <div className="photo-actions">
        {/* Gerçek dosya seçici gizli ama odaklanabilir; görünen düğme onun etiketi */}
        <input
          id={id}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={choose}
          disabled={busy || disabled}
          aria-labelledby={`${id}-label ${id}-button`}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        />
        <label htmlFor={id} id={`${id}-button`} className="btn btn-secondary btn-sm">
          {busy ? <Spinner size={16} /> : <ImageSquare size={18} aria-hidden="true" />}
          {busy ? "Hazırlanıyor…" : preview ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
        </label>
        {preview && !busy && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={remove} disabled={disabled}>
            <Trash size={18} aria-hidden="true" />
            Kaldır
          </button>
        )}
      </div>
      <p className="field-hint" id={`${id}-hint`}>
        JPEG, PNG ya da WebP. Fotoğraf gönderilmeden önce küçültülür ve içindeki konum bilgisi silinir.
      </p>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhotoPicker;
