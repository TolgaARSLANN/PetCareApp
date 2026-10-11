import React from "react";

const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
    {Icon && (
      <span className="empty-state-icon">
        <Icon size={compact ? 24 : 32} weight="duotone" aria-hidden="true" />
      </span>
    )}
    <p className="empty-state-title">{title}</p>
    {description && <p className="empty-state-text">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
