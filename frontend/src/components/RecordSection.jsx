import React, { useEffect, useRef, useState } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import { Spinner } from "./ui/Loading";

const NOTICES = { add: "Kayıt eklendi.", update: "Kayıt güncellendi.", remove: "Kayıt silindi." };

// Sağlık defterindeki her bölüm (sağlık, kilo, ilaç, randevu, acil kişi) için ortak kart:
// başlık + kayıt sayısı + ekleme formu + kayıt listesi (her kayıtta düzenle / sil).
// Aynı anda bölüm başına tek form açık olur: ya yeni kayıt ya da düzenlenen kayıt.
const RecordSection = ({
  id,
  icon: Icon,
  title,
  emptyText,
  addLabel,
  records = [],
  renderRecord,
  itemLabel,
  initialValues,
  toFormValues,
  renderFields,
  aboveList, // listenin üstünde gösterilecek ek içerik (ör. kilo grafiği)
  api, // { add(values), update(recordId, values), remove(recordId) } · yoksa bölüm salt okunur
}) => {
  const [mode, setMode] = useState(null); // null | "add" | düzenlenen kaydın _id'si
  const [values, setValues] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const formRef = useRef(null);

  // Form açılınca ilk alana odaklan
  useEffect(() => {
    if (mode) formRef.current?.querySelector("input, textarea, select")?.focus();
  }, [mode]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const openAdd = () => {
    setMode((m) => (m === "add" ? null : "add"));
    setValues(initialValues);
    setError("");
    setNotice("");
  };

  const openEdit = (record) => {
    setMode(record._id);
    setValues(toFormValues(record));
    setError("");
    setNotice("");
  };

  const closeForm = () => {
    setMode(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const action = mode === "add" ? "add" : "update";
    try {
      if (action === "add") await api.add(values);
      else await api.update(mode, values);
      setMode(null);
      setValues(initialValues);
      setNotice(NOTICES[action]);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.status === 400
          ? "Zorunlu alanları doldurup tekrar deneyin."
          : "Kaydedilemedi. Bilgileri kontrol edip tekrar deneyin."
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.remove(toDelete._id);
      if (mode === toDelete._id) setMode(null);
      setToDelete(null);
      setNotice(NOTICES.remove);
    } catch (err) {
      console.error(err);
      setDeleteError("Silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setDeleting(false);
    }
  };

  const formId = `${id}-form`;

  const renderForm = (submitLabel) => (
    <form id={formId} ref={formRef} className="inline-form" onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      {renderFields(values, set)}
      <div className="form-actions">
        {mode !== "add" && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={closeForm} disabled={busy}>
            Vazgeç
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy && <Spinner size={14} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <section className="card record-section" aria-labelledby={`${id}-title`}>
      <div className="section-card-head">
        <span className="icon-tile">
          <Icon size={22} weight="duotone" aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="card-title">
          {title}
          <span className="count-badge" aria-label={`${records.length} kayıt`}>
            {records.length}
          </span>
        </h2>
        {api && (
          <button
            type="button"
            className={`btn btn-sm ${mode === "add" ? "btn-ghost" : "btn-secondary"} section-card-action`}
            onClick={openAdd}
            aria-expanded={mode === "add"}
            aria-controls={mode === "add" ? formId : undefined}
            aria-label={mode === "add" ? `${title}: formu kapat` : `${title}: yeni kayıt ekle`}
          >
            {mode === "add" ? (
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

      {notice && !mode && (
        <Alert type="success" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      {mode === "add" && renderForm(addLabel)}

      {records.length > 0 && aboveList}

      {records.length > 0 ? (
        <ul className="record-list">
          {records.map((record, index, list) =>
            mode === record._id ? (
              <li key={record._id} className="record-item record-item-editing">
                {renderForm("Değişiklikleri kaydet")}
              </li>
            ) : (
              <li key={record._id || index} className="record-item">
                <div className="record-body">{renderRecord(record, index, list)}</div>
                {api && record._id && (
                  <div className="icon-actions record-actions">
                    <button
                      type="button"
                      className="btn-icon btn-icon-sm"
                      onClick={() => openEdit(record)}
                      aria-label={`${itemLabel(record)} kaydını düzenle`}
                      title="Düzenle"
                    >
                      <PencilSimple size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-sm btn-icon-danger"
                      onClick={() => {
                        setDeleteError("");
                        setToDelete(record);
                      }}
                      aria-label={`${itemLabel(record)} kaydını sil`}
                      title="Sil"
                    >
                      <Trash size={18} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      ) : (
        mode !== "add" && <EmptyState compact icon={Icon} title={emptyText} />
      )}

      {api && (
        <ConfirmDialog
          open={Boolean(toDelete)}
          title="Kayıt silinsin mi?"
          message={toDelete ? `${itemLabel(toDelete)} kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.` : ""}
          confirmLabel="Evet, sil"
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  );
};

export default RecordSection;
