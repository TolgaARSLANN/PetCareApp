import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CaretDown, CaretUp, MapPin, Syringe } from "@phosphor-icons/react";
import { buildUpcoming, relativeDay } from "../utils/upcoming";

const VISIBLE = 5;

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });

// Evcil Dostlarım sayfasında tüm dostların yaklaşan randevuları ve aşı tekrarları
const UpcomingPanel = ({ pets }) => {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => buildUpcoming(pets), [pets]);
  const visible = expanded ? items : items.slice(0, VISIBLE);
  const overdueCount = items.filter((i) => i.overdue).length;

  return (
    <section className="card upcoming-panel" aria-labelledby="upcoming-title">
      <div className="section-card-head">
        <span className="icon-tile">
          <CalendarCheck size={22} weight="duotone" aria-hidden="true" />
        </span>
        <div>
          <h2 id="upcoming-title" className="card-title">
            Yaklaşanlar
            <span className="count-badge" aria-label={`${items.length} öğe`}>
              {items.length}
            </span>
          </h2>
          <p className="card-subtitle">
            Randevular ve 30 gün içindeki aşı tekrarları
            {overdueCount > 0 && <span className="upcoming-overdue-note"> · {overdueCount} gecikmiş aşı</span>}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">Önümüzdeki günlerde randevu ya da aşı tekrarı yok.</p>
      ) : (
        <>
          <ul className="upcoming-list" id="upcoming-list">
            {visible.map((item) => {
              const date = new Date(item.date);
              const Icon = item.type === "vaccine" ? Syringe : CalendarCheck;
              return (
                <li key={item.key}>
                  <Link to={`/pets/${item.petId}`} className={`upcoming-item ${item.overdue ? "is-overdue" : ""}`}>
                    <span className="upcoming-date" aria-hidden="true">
                      <span className="upcoming-day">{dayFormatter.format(date)}</span>
                      <span className="upcoming-month">{monthFormatter.format(date)}</span>
                    </span>
                    <span className="upcoming-body">
                      <span className="upcoming-title">
                        <Icon size={16} aria-hidden="true" />
                        {item.title}
                      </span>
                      <span className="upcoming-meta">
                        <strong>{item.petName}</strong>
                        {item.time && ` · ${item.time}`}
                        {item.location && (
                          <>
                            {" · "}
                            <MapPin size={12} aria-hidden="true" /> {item.location}
                          </>
                        )}
                      </span>
                    </span>
                    <span className={`badge ${item.overdue ? "badge-danger" : "badge-neutral"} upcoming-when`}>
                      {item.overdue ? "Gecikti" : relativeDay(item.date)}
                    </span>
                    {/* Ekran okuyucu için tam tarih (görsel tarih kutusu gizli) */}
                    <span className="visually-hidden">
                      , {date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {items.length > VISIBLE && (
            <button
              type="button"
              className="btn btn-ghost btn-sm upcoming-toggle"
              aria-expanded={expanded}
              aria-controls="upcoming-list"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <>
                  <CaretUp size={16} aria-hidden="true" /> Daha az göster
                </>
              ) : (
                <>
                  <CaretDown size={16} aria-hidden="true" /> Tümünü göster ({items.length})
                </>
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default UpcomingPanel;
