import React from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";

const ICONS = { error: WarningCircle, success: CheckCircle, info: Info };

// Hata mesajları ekran okuyucuya hemen (alert), diğerleri sırası gelince (status) okunur
const Alert = ({ type = "info", children, onClose, className = "" }) => {
  const Icon = ICONS[type] || Info;
  return (
    <div className={`alert alert-${type} ${className}`} role={type === "error" ? "alert" : "status"}>
      <Icon className="alert-icon" size={20} weight="fill" aria-hidden="true" />
      <div className="alert-body">{children}</div>
      {onClose && (
        <button type="button" className="btn-icon btn-icon-sm" onClick={onClose} aria-label="Mesajı kapat">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
