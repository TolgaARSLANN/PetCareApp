import React from "react";

export const Spinner = ({ size = 18 }) => (
  <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
);

// Kart iskeletleri: içerik yüklenirken sayfa düzeni kaymasın
export const SkeletonCards = ({ count = 3, label = "Yükleniyor" }) => (
  <div className="card-grid" role="status" aria-live="polite">
    <span className="visually-hidden">{label}…</span>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card skeleton-card" aria-hidden="true">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton skeleton-line" style={{ width: "85%" }} />
        <div className="skeleton skeleton-line" style={{ width: "40%" }} />
      </div>
    ))}
  </div>
);

export const PageLoader = ({ label = "Yükleniyor" }) => (
  <div className="page-loader" role="status" aria-live="polite">
    <Spinner size={28} />
    <span>{label}…</span>
  </div>
);
