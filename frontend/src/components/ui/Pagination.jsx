import React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { pageItems } from "../../utils/pagination";

// Sayfa gezinme: önceki/sonraki ve numaralı düğmeler. Geçerli sayfa aria-current ile işaretlenir.
const Pagination = ({ page, totalPages, onChange, label = "Sayfalar" }) => {
  const items = pageItems(page, totalPages);
  if (items.length === 0) return null;

  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="pagination-btn pagination-step"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <CaretLeft size={16} aria-hidden="true" />
        <span>Önceki</span>
      </button>

      <ul className="pagination-pages">
        {items.map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} className="pagination-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => onChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Sayfa ${item}`}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="pagination-btn pagination-step"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        <span>Sonraki</span>
        <CaretRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
