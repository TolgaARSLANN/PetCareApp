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
import WeightChart from "./WeightChart";
import Alert from "./ui/Alert";
import EmptyState from "./ui/EmptyState";
import Field from "./ui/Field";
import { PageLoader } from "./ui/Loading";
import SpeciesIcon from "./ui/SpeciesIcon";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  calendarDay,
  capitalizeTr,
  formatDate,
  localDay,
  petAge,
  sortByDateDesc,
  toDateInput,
  todayInputValue,
} from "../utils/format";
import { nextVaccineDue, VACCINE_STATUS_BADGES, vaccineStatus } from "../utils/vaccines";

// Metin sınırları: backend/server/models/Pet.js ile aynı
const SHORT_TEXT = 100;
const LONG_TEXT = 2000;
const MAX_WEIGHT_KG = 500;

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

  // Bir kayıt türü için ekle / güncelle / sil çağrıları. Sunucu her durumda o türün güncel
  // listesini döndürür; pet state'inde yalnızca o alan güncellenir.
  const recordApi = (path, field) => ({
    add: async (values) => {
      const { data } = await API.post(`/pets/${id}/${path}`, values);
      setPet((p) => ({ ...p, [field]: data }));
    },
    update: async (recordId, values) => {
      const { data } = await API.put(`/pets/${id}/${path}/${recordId}`, values);
      setPet((p) => ({ ...p, [field]: data }));
    },
    remove: async (recordId) => {
      const { data } = await API.delete(`/pets/${id}/${path}/${recordId}`);
      setPet((p) => ({ ...p, [field]: data }));
    },
  });

  // Özet kutucukları için hesaplanan değerler
  const summary = useMemo(() => {
    if (!pet) return {};
    const latestWeight = sortByDateDesc(pet.weightHistory || [])[0];
    const upcoming = [...(pet.appointments || [])]
      .filter((a) => a.date && calendarDay(a.date) >= localDay())
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const activeMeds = (pet.medicationRecords || []).filter(
      (m) => !m.endDate || calendarDay(m.endDate) >= localDay()
    ).length;
    const nextVaccine = nextVaccineDue(pet.vaccines);
    return { latestWeight, upcoming, activeMeds, nextVaccine };
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
          <div className="stat">
            <dt>Sıradaki aşı</dt>
            <dd>
              {summary.nextVaccine ? (
                <>
                  {formatDate(summary.nextVaccine.nextDueDate)}
                  {vaccineStatus(summary.nextVaccine, pet.vaccines) === "overdue" && (
                    <span className="stat-flag">Gecikti</span>
                  )}
                </>
              ) : (
                "Yok"
              )}
            </dd>
          </div>
        </dl>
      </header>

      {/* Öneriler kayıtlara göre üretildiği için her kayıt değişikliğinde yenilenir */}
      <PetRecommendations petId={id} refreshKey={pet} />

      <div className="record-grid">
        {/* Sağlık kayıtları */}
        <RecordSection
          id="health"
          icon={FirstAidKit}
          title="Sağlık kayıtları"
          emptyText="Henüz sağlık kaydı yok."
          addLabel="Kaydı ekle"
          records={sortByDateDesc(pet.healthRecords)}
          itemLabel={(r) => `${formatDate(r.date)} tarihli sağlık`}
          initialValues={{ date: today, notes: "" }}
          toFormValues={(r) => ({ date: toDateInput(r.date), notes: r.notes || "" })}
          api={recordApi("health-records", "healthRecords")}
          renderFields={(v, set) => (
            <>
              <Field id="health-date" label="Tarih" required>
                <input type="date" className="input" value={v.date} max={today} onChange={set("date")} />
              </Field>
              <Field id="health-notes" label="Not" hint="Örn. genel kontrol, şikâyet, veterinerin önerisi." required>
                <textarea className="input" rows={3} value={v.notes} onChange={set("notes")} maxLength={LONG_TEXT} />
              </Field>
            </>
          )}
          renderRecord={(record) => (
            <>
              <time className="record-date" dateTime={record.date}>
                {formatDate(record.date)}
              </time>
              <p className="record-text">{record.notes}</p>
            </>
          )}
        />

        {/* Aşılar */}
        <RecordSection
          id="vaccines"
          icon={Syringe}
          title="Aşılar"
          emptyText="Henüz aşı kaydı yok."
          addLabel="Aşıyı ekle"
          records={sortByDateDesc(pet.vaccines, "vaccineDate")}
          itemLabel={(v) => `${formatDate(v.vaccineDate)} tarihli ${v.vaccineName} aşı`}
          initialValues={{ vaccineName: "", vaccineDate: today, nextDueDate: "", notes: "" }}
          toFormValues={(v) => ({
            vaccineName: v.vaccineName || "",
            vaccineDate: toDateInput(v.vaccineDate),
            nextDueDate: toDateInput(v.nextDueDate),
            notes: v.notes || "",
          })}
          api={recordApi("vaccines", "vaccines")}
          renderFields={(v, set) => (
            <>
              <Field id="vaccine-name" label="Aşı adı" hint="Örn. Kuduz, Karma, Lösemi" required>
                <input type="text" className="input" value={v.vaccineName} onChange={set("vaccineName")} maxLength={SHORT_TEXT} />
              </Field>
              <div className="form-grid form-grid-2">
                <Field id="vaccine-date" label="Uygulama tarihi" required>
                  <input
                    type="date"
                    className="input"
                    value={v.vaccineDate}
                    max={today}
                    onChange={set("vaccineDate")}
                  />
                </Field>
                <Field id="vaccine-due" label="Tekrar tarihi" hint="Veterinerin önerdiği rapel tarihi" optional>
                  <input
                    type="date"
                    className="input"
                    value={v.nextDueDate}
                    min={v.vaccineDate || undefined}
                    onChange={set("nextDueDate")}
                  />
                </Field>
              </div>
              <Field id="vaccine-notes" label="Not" hint="Örn. aşı markası, seri no, yan etki" optional>
                <textarea className="input" rows={2} value={v.notes} onChange={set("notes")} maxLength={LONG_TEXT} />
              </Field>
            </>
          )}
          renderRecord={(vaccine) => {
            const badge = VACCINE_STATUS_BADGES[vaccineStatus(vaccine, pet.vaccines)];
            return (
              <>
                <div className="record-title-row">
                  <strong>{vaccine.vaccineName}</strong>
                  {badge && <span className={`badge ${badge.className}`}>{badge.label}</span>}
                </div>
                <p className="record-meta">
                  Yapıldı: {formatDate(vaccine.vaccineDate)}
                  {vaccine.nextDueDate && ` · Tekrar: ${formatDate(vaccine.nextDueDate)}`}
                </p>
                {vaccine.notes && <p className="record-meta">{vaccine.notes}</p>}
              </>
            );
          }}
        />

        {/* Kilo geçmişi */}
        <RecordSection
          id="weight"
          icon={Scales}
          title="Kilo geçmişi"
          emptyText="Henüz kilo kaydı yok."
          addLabel="Kiloyu ekle"
          records={sortByDateDesc(pet.weightHistory)}
          itemLabel={(w) => `${formatDate(w.date)} tarihli ${w.weight} kg`}
          initialValues={{ date: today, weight: "" }}
          toFormValues={(w) => ({ date: toDateInput(w.date), weight: w.weight ?? "" })}
          api={recordApi("weight", "weightHistory")}
          aboveList={<WeightChart records={pet.weightHistory} />}
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
                  min="0.01"
                  max={MAX_WEIGHT_KG}
                  step="0.01"
                  value={v.weight}
                  onChange={set("weight")}
                />
              </Field>
            </div>
          )}
          renderRecord={(w, i, list) => {
            const prev = list[i + 1];
            const diff = prev ? Math.round((w.weight - prev.weight) * 100) / 100 : null;
            return (
              <div className="record-row">
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
              </div>
            );
          }}
        />

        {/* İlaç tedavileri */}
        <RecordSection
          id="meds"
          icon={Pill}
          title="İlaç tedavileri"
          emptyText="Henüz ilaç tedavisi kaydı yok."
          addLabel="Tedaviyi ekle"
          records={sortByDateDesc(pet.medicationRecords, "startDate")}
          itemLabel={(m) => `${m.name} ilaç`}
          initialValues={{ name: "", dosage: "", frequency: "", startDate: today, endDate: "", notes: "" }}
          toFormValues={(m) => ({
            name: m.name || "",
            dosage: m.dosage || "",
            frequency: m.frequency || "",
            startDate: toDateInput(m.startDate),
            endDate: toDateInput(m.endDate),
            notes: m.notes || "",
          })}
          api={recordApi("medications", "medicationRecords")}
          renderFields={(v, set) => (
            <>
              <div className="form-grid form-grid-2">
                <Field id="med-name" label="İlaç adı" required>
                  <input type="text" className="input" value={v.name} onChange={set("name")} maxLength={SHORT_TEXT} />
                </Field>
                <Field id="med-dosage" label="Doz" hint="Örn. 1 tablet, 5 ml" required>
                  <input type="text" className="input" value={v.dosage} onChange={set("dosage")} maxLength={SHORT_TEXT} />
                </Field>
                <Field id="med-frequency" label="Sıklık" hint="Örn. günde 2 kez" optional>
                  <input type="text" className="input" value={v.frequency} onChange={set("frequency")} maxLength={SHORT_TEXT} />
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
                <textarea className="input" rows={2} value={v.notes} onChange={set("notes")} maxLength={LONG_TEXT} />
              </Field>
            </>
          )}
          renderRecord={(med) => {
            const active = !med.endDate || calendarDay(med.endDate) >= localDay();
            return (
              <>
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
              </>
            );
          }}
        />

        {/* Randevular */}
        <RecordSection
          id="appointments"
          icon={CalendarCheck}
          title="Randevular"
          emptyText="Henüz randevu yok."
          addLabel="Randevuyu ekle"
          records={sortByDateDesc(pet.appointments)}
          itemLabel={(a) => `${formatDate(a.date)} tarihli randevu`}
          initialValues={{ date: "", time: "", reason: "", location: "" }}
          toFormValues={(a) => ({
            date: toDateInput(a.date),
            time: a.time || "",
            reason: a.reason || "",
            location: a.location || "",
          })}
          api={recordApi("appointments", "appointments")}
          renderFields={(v, set) => (
            <div className="form-grid form-grid-2">
              <Field id="app-date" label="Tarih" required>
                <input type="date" className="input" value={v.date} onChange={set("date")} />
              </Field>
              <Field id="app-time" label="Saat" optional>
                <input type="time" className="input" value={v.time} onChange={set("time")} />
              </Field>
              <Field id="app-reason" label="Sebep" hint="Örn. aşı, genel kontrol" optional>
                <input type="text" className="input" value={v.reason} onChange={set("reason")} maxLength={SHORT_TEXT} />
              </Field>
              <Field id="app-location" label="Yer" hint="Örn. klinik adı" optional>
                <input type="text" className="input" value={v.location} onChange={set("location")} maxLength={SHORT_TEXT} />
              </Field>
            </div>
          )}
          renderRecord={(app) => {
            const upcoming = app.date && calendarDay(app.date) >= localDay();
            return (
              <>
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
              </>
            );
          }}
        />

        {/* Acil durum kişileri */}
        <RecordSection
          id="contacts"
          icon={Phone}
          title="Acil durum kişileri"
          emptyText="Henüz acil durum kişisi yok."
          addLabel="Kişiyi ekle"
          records={pet.emergencyContacts || []}
          itemLabel={(ec) => `${ec.name} kişi`}
          initialValues={{ name: "", relationship: "", phone: "", address: "" }}
          toFormValues={(ec) => ({
            name: ec.name || "",
            relationship: ec.relationship || "",
            phone: ec.phone || "",
            address: ec.address || "",
          })}
          api={recordApi("emergency-contact", "emergencyContacts")}
          renderFields={(v, set) => (
            <div className="form-grid form-grid-2">
              <Field id="ec-name" label="Ad soyad" required>
                <input type="text" className="input" value={v.name} onChange={set("name")} maxLength={SHORT_TEXT} autoComplete="name" />
              </Field>
              <Field id="ec-relation" label="Yakınlık" hint="Örn. veteriner, aile" optional>
                <input type="text" className="input" value={v.relationship} onChange={set("relationship")} maxLength={SHORT_TEXT} />
              </Field>
              <Field id="ec-phone" label="Telefon" required>
                <input type="tel" className="input" value={v.phone} onChange={set("phone")} autoComplete="tel" maxLength={30} />
              </Field>
              <Field id="ec-address" label="Adres" optional>
                <input type="text" className="input" value={v.address} onChange={set("address")} maxLength={LONG_TEXT} />
              </Field>
            </div>
          )}
          renderRecord={(ec) => (
            <>
              <div className="record-title-row">
                <strong>{ec.name}</strong>
                {ec.relationship && <span className="badge badge-neutral">{ec.relationship}</span>}
              </div>
              <a className="record-link" href={`tel:${ec.phone}`}>
                <Phone size={14} aria-hidden="true" />
                {ec.phone}
              </a>
              {ec.address && <p className="record-meta">{ec.address}</p>}
            </>
          )}
        />
      </div>

      <Alert type="info" className="mt-6">
        Bu kayıtlar takip amaçlıdır; tıbbi bir sorun için mutlaka veterinerinize danışın.
      </Alert>
    </div>
  );
};

export default PetDetails;
