import React, { useEffect, useId, useRef } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Spinner } from "./Loading";

// Tarayıcının window.confirm penceresi yerine erişilebilir onay penceresi.
// Yerel <dialog> odak tuzağını ve Escape ile kapatmayı kendisi sağlar.
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  busy = false,
  error,
  onConfirm,
  onCancel,
}) => {
  const ref = useRef(null);
  // Aynı sayfada birden çok pencere olabildiği için kimlikler benzersiz olmalı
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        // Arka plana tıklayınca kapat
        if (e.target === ref.current && !busy) onCancel();
      }}
    >
      <div className="dialog-content">
        <span className="dialog-icon">
          <WarningCircle size={24} weight="fill" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <p id={messageId} className="dialog-message">
          {message}
        </p>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
