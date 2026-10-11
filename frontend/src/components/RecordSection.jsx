import React, { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import Alert from "./ui/Alert";
import EmptyState from "./ui/EmptyState";
import { Spinner } from "./ui/Loading";

// Sağlık defterindeki her bölüm (sağlık, kilo, ilaç, randevu, acil kişi) için ortak kart:
// başlık + kayıt sayısı + açılır ekleme formu + liste / boş durum
const RecordSection = ({
  id,
  icon: Icon,
  title,
  count = 0,
  emptyText,
  addLabel,
  initialValues,
  onSubmit,
  renderFields,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const toggle = () => {
    setOpen((o) => !o);
    setError("");
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
      setValues(initialValues);
      setOpen(false);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const formId = `${id}-form`;

  return (
    <section className="card record-section" aria-labelledby={`${id}-title`}>
      <div className="section-card-head">
        <span className="icon-tile">
          <Icon size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="card-title">
          {title}
          <span className="count-badge" aria-label={`${count} kayıt`}>
            {count}
          </span>
        </h2>
        {onSubmit && (
          <button
            type="button"
            className={`btn btn-sm ${open ? "btn-ghost" : "btn-secondary"} section-card-action`}
            onClick={toggle}
            aria-expanded={open}
            aria-controls={formId}
            aria-label={open ? `${title}: formu kapat` : `${title}: yeni kayıt ekle`}
          >
            {open ? (
              "Vazgeç"
            ) : (
              <>
                <Plus size={16} weight="bold" aria-hidden="true" />
                Ekle
              </>
            )}
          </button>
        )}
      </div>

      {saved && !open && (
        <Alert type="success" onClose={() => setSaved(false)} className="mb-3">
          Kayıt eklendi.
        </Alert>
      )}

      {open && (
        <form id={formId} className="inline-form" onSubmit={handleSubmit}>
          {error && <Alert type="error">{error}</Alert>}
          {renderFields(values, set)}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy && <Spinner size={14} />}
              {addLabel}
            </button>
          </div>
        </form>
      )}

      {count > 0 ? children : !open && <EmptyState compact icon={Icon} title={emptyText} />}
    </section>
  );
};

export default RecordSection;
