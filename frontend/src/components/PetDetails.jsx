import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  FirstAidKit,
  MapPin,
  Phone,
  Pill,
  Scales,
  Syringe,
} from "@phosphor-icons/react";
import API from "../services/api";
import PetRecommendations from "./PetRecommendations";
import RecordSection from "./RecordSection";
import Alert from "./ui/Alert";
import EmptyState from "./ui/EmptyState";
import Field from "./ui/Field";
import { PageLoader } from "./ui/Loading";
import SpeciesIcon from "./ui/SpeciesIcon";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { capitalizeTr, formatDate, petAge, sortByDateDesc, todayInputValue } from "../utils/format";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const PetDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useDocumentTitle(pet ? `${pet.name} · Sağlık defteri` : "Sağlık defteri");

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        const { data } = await API.get(`/pets/${id}`);
        setPet(data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? "Bu evcil dost bulunamadı. Silinmiş ya da size ait olmayabilir."
            : "Evcil dost bilgileri yüklenemedi. Lütfen sayfayı yenileyin."
        );
        console.error("Error fetching pet details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPetDetails();
  }, [id]);

  const today = todayInputValue();

  // Özet kutucukları için hesaplanan değerler
  const summary = useMemo(() => {
    if (!pet) return {};
    const latestWeight = sortByDateDesc(pet.weightHistory || [])[0];
    const upcoming = [...(pet.appointments || [])]
      .filter((a) => a.date && new Date(a.date) >= startOfToday())
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const activeMeds = (pet.medicationRecords || []).filter(
      (m) => !m.endDate || new Date(m.endDate) >= startOfToday()
    ).length;
    return { latestWeight, upcoming, activeMeds };
  }, [pet]);

  if (loading) return <PageLoader label="Sağlık defteri yükleniyor" />;

  if (error || !pet) {
    return (
      <div className="container page">
        <EmptyState
          icon={FirstAidKit}
          title="Sağlık defteri açılamadı"
          description={error || "Evcil dost bulunamadı."}
          action={
            <Link to="/pets" className="btn btn-primary">
              Evcil dostlarıma dön
            </Link>
          }
        />
      </div>
    );
  }

  const age = petAge(pet.birthDate);

  return (
    <div className="container page">
      <Link to="/pets" className="back-link">
        <ArrowLeft size={18} aria-hidden="true" />
        Evcil Dostlarım
      </Link>

      <header className="card pet-hero">
        <span className={`avatar avatar-lg avatar-${pet.species || "diğer"}`}>
          <SpeciesIcon species={pet.species} size={40} />
        </span>
        <div className="pet-hero-info">
          <h1 className="page-title">{pet.name}</h1>
          <p className="pet-hero-meta">
            <span className="badge">{capitalizeTr(pet.species) || "Belirtilmemiş"}</span>
            {age && <span>{age}</span>}
            {pet.birthDate && <span>Doğum: {formatDate(pet.birthDate)}</span>}
          </p>
        </div>
        <dl className="stat-grid">
          <div className="stat">
            <dt>Son kilo</dt>
            <dd>{summary.latestWeight ? `${summary.latestWeight.weight} kg` : "-"}</dd>
          </div>
          <div className="stat">
            <dt>Yaklaşan randevu</dt>
            <dd>{summary.upcoming ? formatDate(summary.upcoming.date) : "Yok"}</dd>
          </div>
          <div className="stat">
            <dt>Devam eden ilaç</dt>
            <dd>{summary.activeMeds}</dd>
          </div>
        </dl>
      </header>

      {/* Öneriler kayıtlara göre üretildiği için her yeni kayıtta yenilenir */}
      <PetRecommendations petId={id} refreshKey={pet} />

      <div className="record-grid">
        {/* Sağlık kayıtları */}
        <RecordSection
          id="health"
          icon={FirstAidKit}
          title="Sağlık kayıtları"
          count={pet.healthRecords?.length || 0}
          emptyText="Henüz sağlık kaydı yok."
          addLabel="Kaydı ekle"
          initialValues={{ date: today, notes: "" }}
          onSubmit={async (values) => {
            const { data } = await API.post(`/pets/${id}/health-records`, values);
            setPet(data);
          }}
          renderFields={(v, set) => (
            <>
              <Field id="health-date" label="Tarih" required>
                <input type="date" className="input" value={v.date} max={today} onChange={set("date")} />
              </Field>
              <Field id="health-notes" label="Not" hint="Örn. genel kontrol, şikâyet, veterinerin önerisi." required>
                <textarea className="input" rows={3} value={v.notes} onChange={set("notes")} />
              </Field>
            </>
          )}
        >
          <ul className="record-list">
            {sortByDateDesc(pet.healthRecords).map((record) => (
              <li key={record._id || `${record.date}-${record.notes}`} className="record-item">
                <time className="record-date" dateTime={record.date}>
                  {formatDate(record.date)}
                </time>
                <p className="record-text">{record.notes}</p>
              </li>
            ))}
          </ul>
        </RecordSection>

        {/* Kilo geçmişi */}
        <RecordSection
          id="weight"
          icon={Scales}
          title="Kilo geçmişi"
          count={pet.weightHistory?.length || 0}
          emptyText="Henüz kilo kaydı yok."
          addLabel="Kiloyu ekle"
          initialValues={{ date: today, weight: "" }}
          onSubmit={async (values) => {
            const { data } = await API.post(`/pets/${id}/weight`, values);
            setPet((p) => ({ ...p, weightHistory: data }));
          }}
          renderFields={(v, set) => (
            <div className="form-grid form-grid-2">
              <Field id="weight-date" label="Tarih" required>
                <input type="date" className="input" value={v.date} max={today} onChange={set("date")} />
              </Field>
              <Field id="weight-value" label="Kilo (kg)" required>
                <input
                  type="number"
                  className="input"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={v.weight}
                  onChange={set("weight")}
                />
              </Field>
            </div>
          )}
        >
          <ul className="record-list">
            {sortByDateDesc(pet.weightHistory).map((w, i, list) => {
              const prev = list[i + 1];
              const diff = prev ? Math.round((w.weight - prev.weight) * 100) / 100 : null;
              return (
                <li key={w._id || `${w.date}-${w.weight}`} className="record-item record-item-row">
                  <time className="record-date" dateTime={w.date}>
                    {formatDate(w.date)}
                  </time>
                  <span className="record-value">
                    {w.weight} kg
                    {diff !== null && diff !== 0 && (
                      <span className={`delta ${diff > 0 ? "delta-up" : "delta-down"}`}>
                        {diff > 0 ? "+" : "−"}
                        {Math.abs(diff)} kg
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </RecordSection>

        {/* İlaç tedavileri */}
        <RecordSection
          id="meds"
          icon={Pill}
          title="İlaç tedavileri"
          count={pet.medicationRecords?.length || 0}
          emptyText="Henüz ilaç tedavisi kaydı yok."
          addLabel="Tedaviyi ekle"
          initialValues={{ name: "", dosage: "", frequency: "", startDate: today, endDate: "", notes: "" }}
          onSubmit={async (values) => {
            const { data } = await API.post(`/pets/${id}/medications`, values);
            setPet((p) => ({ ...p, medicationRecords: data }));
          }}
          renderFields={(v, set) => (
            <>
              <div className="form-grid form-grid-2">
                <Field id="med-name" label="İlaç adı" required>
                  <input type="text" className="input" value={v.name} onChange={set("name")} />
                </Field>
                <Field id="med-dosage" label="Doz" hint="Örn. 1 tablet, 5 ml" required>
                  <input type="text" className="input" value={v.dosage} onChange={set("dosage")} />
                </Field>
                <Field id="med-frequency" label="Sıklık" hint="Örn. günde 2 kez" optional>
                  <input type="text" className="input" value={v.frequency} onChange={set("frequency")} />
                </Field>
                <div />
                <Field id="med-start" label="Başlangıç tarihi" optional>
                  <input type="date" className="input" value={v.startDate} onChange={set("startDate")} />
                </Field>
                <Field id="med-end" label="Bitiş tarihi" optional>
                  <input
                    type="date"
                    className="input"
                    value={v.endDate}
                    min={v.startDate || undefined}
                    onChange={set("endDate")}
                  />
                </Field>
              </div>
              <Field id="med-notes" label="Not" optional>
                <textarea className="input" rows={2} value={v.notes} onChange={set("notes")} />
              </Field>
            </>
          )}
        >
          <ul className="record-list">
            {sortByDateDesc(pet.medicationRecords, "startDate").map((med) => {
              const active = !med.endDate || new Date(med.endDate) >= startOfToday();
              return (
                <li key={med._id || `${med.name}-${med.startDate}`} className="record-item">
                  <div className="record-title-row">
                    <strong>{med.name}</strong>
                    <span className={`badge ${active ? "badge-success" : "badge-neutral"}`}>
                      {active ? "Devam ediyor" : "Tamamlandı"}
                    </span>
                  </div>
                  <p className="record-text">{[med.dosage, med.frequency].filter(Boolean).join(" · ")}</p>
                  {(med.startDate || med.endDate) && (
                    <p className="record-meta">
                      {formatDate(med.startDate)} – {med.endDate ? formatDate(med.endDate) : "devam ediyor"}
                    </p>
                  )}
                  {med.notes && <p className="record-meta">{med.notes}</p>}
                </li>
              );
            })}
          </ul>
        </RecordSection>

        {/* Randevular */}
        <RecordSection
          id="appointments"
          icon={CalendarCheck}
          title="Randevular"
          count={pet.appointments?.length || 0}
          emptyText="Henüz randevu yok."
          addLabel="Randevuyu ekle"
          initialValues={{ date: "", time: "", reason: "", location: "" }}
          onSubmit={async (values) => {
            const { data } = await API.post(`/pets/${id}/appointments`, values);
            setPet((p) => ({ ...p, appointments: data }));
          }}
          renderFields={(v, set) => (
            <div className="form-grid form-grid-2">
              <Field id="app-date" label="Tarih" required>
                <input type="date" className="input" value={v.date} onChange={set("date")} />
              </Field>
              <Field id="app-time" label="Saat" optional>
                <input type="time" className="input" value={v.time} onChange={set("time")} />
              </Field>
              <Field id="app-reason" label="Sebep" hint="Örn. aşı, genel kontrol" optional>
                <input type="text" className="input" value={v.reason} onChange={set("reason")} />
              </Field>
              <Field id="app-location" label="Yer" hint="Örn. klinik adı" optional>
                <input type="text" className="input" value={v.location} onChange={set("location")} />
              </Field>
            </div>
          )}
        >
          <ul className="record-list">
            {sortByDateDesc(pet.appointments).map((app) => {
              const upcoming = app.date && new Date(app.date) >= startOfToday();
              return (
                <li key={app._id || `${app.date}-${app.time}`} className="record-item">
                  <div className="record-title-row">
                    <strong>
                      {formatDate(app.date)}
                      {app.time && ` · ${app.time}`}
                    </strong>
                    <span className={`badge ${upcoming ? "badge-info" : "badge-neutral"}`}>
                      {upcoming ? "Yaklaşan" : "Geçmiş"}
                    </span>
                  </div>
                  {app.reason && <p className="record-text">{app.reason}</p>}
                  {app.location && (
                    <p className="record-meta with-icon">
                      <MapPin size={14} aria-hidden="true" />
                      {app.location}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </RecordSection>

        {/* Acil durum kişileri */}
        <RecordSection
          id="contacts"
          icon={Phone}
          title="Acil durum kişileri"
          count={pet.emergencyContacts?.length || 0}
          emptyText="Henüz acil durum kişisi yok."
          addLabel="Kişiyi ekle"
          initialValues={{ name: "", relationship: "", phone: "", address: "" }}
          onSubmit={async (values) => {
            const { data } = await API.post(`/pets/${id}/emergency-contact`, values);
            setPet((p) => ({ ...p, emergencyContacts: data }));
          }}
          renderFields={(v, set) => (
            <div className="form-grid form-grid-2">
              <Field id="ec-name" label="Ad soyad" required>
                <input type="text" className="input" value={v.name} onChange={set("name")} autoComplete="name" />
              </Field>
              <Field id="ec-relation" label="Yakınlık" hint="Örn. veteriner, aile" optional>
                <input type="text" className="input" value={v.relationship} onChange={set("relationship")} />
              </Field>
              <Field id="ec-phone" label="Telefon" required>
                <input type="tel" className="input" value={v.phone} onChange={set("phone")} autoComplete="tel" />
              </Field>
              <Field id="ec-address" label="Adres" optional>
                <input type="text" className="input" value={v.address} onChange={set("address")} />
              </Field>
            </div>
          )}
        >
          <ul className="record-list">
            {(pet.emergencyContacts || []).map((ec) => (
              <li key={ec._id || `${ec.name}-${ec.phone}`} className="record-item">
                <div className="record-title-row">
                  <strong>{ec.name}</strong>
                  {ec.relationship && <span className="badge badge-neutral">{ec.relationship}</span>}
                </div>
                <a className="record-link" href={`tel:${ec.phone}`}>
                  <Phone size={14} aria-hidden="true" />
                  {ec.phone}
                </a>
                {ec.address && <p className="record-meta">{ec.address}</p>}
              </li>
            ))}
          </ul>
        </RecordSection>

        {/* Aşılar: yalnızca kayıt varsa gösterilir (eklemek için arayüz yok) */}
        {pet.vaccines?.length > 0 && (
          <RecordSection id="vaccines" icon={Syringe} title="Aşılar" count={pet.vaccines.length}>
            <ul className="record-list">
              {sortByDateDesc(pet.vaccines, "vaccineDate").map((vaccine) => (
                <li key={vaccine._id || vaccine.vaccineName} className="record-item record-item-row">
                  <strong>{vaccine.vaccineName}</strong>
                  <time className="record-date" dateTime={vaccine.vaccineDate}>
                    {formatDate(vaccine.vaccineDate)}
                  </time>
                </li>
              ))}
            </ul>
          </RecordSection>
        )}
      </div>

      <Alert type="info" className="mt-6">
        Bu kayıtlar takip amaçlıdır; tıbbi bir sorun için mutlaka veterinerinize danışın.
      </Alert>
    </div>
  );
};

export default PetDetails;
