import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import PetRecommendations from "./PetRecommendations"; // Öneri component'ini ekledik
import "./PetDetails.css";

const PetDetails = () => {
  const { id } = useParams(); // URL'den pet ID'sini al
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sağlık kaydı eklemek için kullanılan state
  const [newHealthRecord, setNewHealthRecord] = useState({ date: "", notes: "" });

  // 1. Ağırlık Takibi için state
  const [newWeight, setNewWeight] = useState({ date: "", weight: "" });

  // 2. İlaç Kayıtları için state
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  // 3. Randevu Yönetimi için state
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    reason: "",
    location: "",
  });

  // 4. Bakım Takvimi için state
  const [newGrooming, setNewGrooming] = useState({
    date: "",
    type: "",
    notes: "",
  });

  // 5. Aktivite Kayıtları için state
  const [newActivity, setNewActivity] = useState({
    date: "",
    type: "",
    duration: "",
    notes: "",
  });

  // 6. Acil Durum Kontakları için state
  const [newEmergencyContact, setNewEmergencyContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    address: "",
  });

  // Sayfa ilk yüklendiğinde Pet detaylarını getir
  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        const { data } = await API.get(`/pets/${id}`);
        setPet(data);
      } catch (err) {
        setError("Failed to load pet details. Please try again.");
        console.error("Error fetching pet details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPetDetails();
  }, [id]);

  // Sağlık kaydı ekleme
  const handleAddHealthRecord = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/health-records`, newHealthRecord);
      setPet(data); // Yeni sağlık kaydını güncelle
      setNewHealthRecord({ date: "", notes: "" }); // Formu sıfırla
    } catch (err) {
      console.error("Error adding health record:", err);
      setError("Failed to add health record. Please try again.");
    }
  };

  // 1. Ağırlık Takibi Ekleme
  const handleAddWeight = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/weight`, newWeight);
      // data, pet.weightHistory dizisini döndürecek şekilde backend tarafında ayarlandı
      setPet({ ...pet, weightHistory: data });
      setNewWeight({ date: "", weight: "" });
    } catch (err) {
      console.error("Error adding weight record:", err);
      setError("Failed to add weight record. Please try again.");
    }
  };

  // 2. Yeni İlaç Kaydı Ekleme
  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/medications`, newMedication);
      setPet({ ...pet, medicationRecords: data });
      setNewMedication({
        name: "",
        dosage: "",
        frequency: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding medication record:", err);
      setError("Failed to add medication record. Please try again.");
    }
  };

  // 3. Yeni Randevu Ekleme
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/appointments`, newAppointment);
      setPet({ ...pet, appointments: data });
      setNewAppointment({
        date: "",
        time: "",
        reason: "",
        location: "",
      });
    } catch (err) {
      console.error("Error adding appointment:", err);
      setError("Failed to add appointment. Please try again.");
    }
  };

  // 4. Yeni Bakım Kaydı Ekleme
  const handleAddGrooming = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/grooming`, newGrooming);
      setPet({ ...pet, groomingSchedule: data });
      setNewGrooming({
        date: "",
        type: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding grooming record:", err);
      setError("Failed to add grooming record. Please try again.");
    }
  };

  // 5. Yeni Aktivite Kaydı Ekleme
  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/activity`, newActivity);
      setPet({ ...pet, activityLogs: data });
      setNewActivity({
        date: "",
        type: "",
        duration: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error adding activity log:", err);
      setError("Failed to add activity log. Please try again.");
    }
  };

  // 6. Yeni Acil Durum Kontağı Ekleme
  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/pets/${id}/emergency-contact`, newEmergencyContact);
      setPet({ ...pet, emergencyContacts: data });
      setNewEmergencyContact({
        name: "",
        relationship: "",
        phone: "",
        address: "",
      });
    } catch (err) {
      console.error("Error adding emergency contact:", err);
      setError("Failed to add emergency contact. Please try again.");
    }
  };

  // Yükleniyor / Hata / Pet Bulunamadı durumları
  if (loading) {
    return <p className="loading-message">Loading pet details...</p>;
  }
  if (error) {
    return <p className="error-message">{error}</p>;
  }
  if (!pet) {
    return <p className="no-pet-message">No pet found. Please try again.</p>;
  }

  return (
    <div className="pet-details">
      <h2>{pet.name}</h2>
      <p>
        <strong>Tür:</strong> {pet.species}
      </p>
      <p>
        <strong>Doğum Tarihi:</strong>{" "}
        {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : "N/A"}
      </p>
      <p>
        <strong>Notlar:</strong> {pet.notes || "Henüz not eklenmedi."}
      </p>

      {/* PetRecommendations Component'i */}
      <PetRecommendations petId={id} />

      {/* ==================== VACCINES ==================== */}
      {pet.vaccines && pet.vaccines.length > 0 && (
        <div>
          <h3>Vaccines:</h3>
          <ul>
            {pet.vaccines.map((vaccine, index) => (
              <li key={index}>
                {vaccine.vaccineName} - (
                {vaccine.vaccineDate
                  ? new Date(vaccine.vaccineDate).toLocaleDateString()
                  : "N/A"}
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== HEALTH RECORDS ==================== */}
      {pet.healthRecords && pet.healthRecords.length > 0 && (
        <div>
          <h3>Health Records:</h3>
          <ul>
            {pet.healthRecords.map((record, index) => (
              <li key={index}>
                {new Date(record.date).toLocaleDateString()}: {record.notes}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="add-health-record">
        <h4>Yeni Sağlık Kaydı Ekle</h4>
        <form onSubmit={handleAddHealthRecord}>
          <input
            type="date"
            value={newHealthRecord.date}
            onChange={(e) =>
              setNewHealthRecord({ ...newHealthRecord, date: e.target.value })
            }
            required
          />
          <textarea
            value={newHealthRecord.notes}
            onChange={(e) =>
              setNewHealthRecord({ ...newHealthRecord, notes: e.target.value })
            }
            placeholder="Sağlık kaydı girin"
            required
          ></textarea>
          <button type="submit">Kayıt Ekle</button>
        </form>
      </div>

      {/* ==================== 1. WEIGHT HISTORY ==================== */}
      <hr />
      <h3>Ağırlık Geçmişi</h3>
      {pet.weightHistory && pet.weightHistory.length > 0 ? (
        <ul>
          {pet.weightHistory.map((w, index) => (
            <li key={index}>
              {w.date ? new Date(w.date).toLocaleDateString() : "N/A"} -{" "}
              {w.weight} kg
            </li>
          ))}
        </ul>
      ) : (
        <p>Henüz ağırlık kaydı girilmedi.</p>
      )}
      <div className="add-weight">
        <h4>Ağırlık Kaydı Ekle</h4>
        <form onSubmit={handleAddWeight}>
          <input
            type="date"
            value={newWeight.date}
            onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
            required
          />
          <input
            type="number"
            step="any"
            value={newWeight.weight}
            onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
            placeholder="Ağırlık (kg)"
            required
          />
          <button type="submit">Ağırlık Ekle</button>
        </form>
      </div>

      {/* ==================== 2. MEDICATION RECORDS ==================== */}
      <hr />
      <h3>İlaç Tedavi Kayıtları</h3>
      {pet.medicationRecords && pet.medicationRecords.length > 0 ? (
        <ul>
          {pet.medicationRecords.map((med, index) => (
            <li key={index}>
              <strong>{med.name}</strong> - Dosage: {med.dosage}, Freq:{" "}
              {med.frequency}, {med.startDate && <em>Start: {new Date(med.startDate).toLocaleDateString()}</em>},{" "}
              {med.endDate && <em>End: {new Date(med.endDate).toLocaleDateString()}</em>}
              {med.notes && ` - ${med.notes}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>Henüz ilaç tedavi kaydı yok.</p>
      )}
      <div className="add-medication">
        <h4>İlaç Tedavi Ekle</h4>
        <form onSubmit={handleAddMedication}>
          <input
            type="text"
            placeholder="İlaç Adı"
            value={newMedication.name}
            onChange={(e) =>
              setNewMedication({ ...newMedication, name: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Dozaj"
            value={newMedication.dosage}
            onChange={(e) =>
              setNewMedication({ ...newMedication, dosage: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Sıklık"
            value={newMedication.frequency}
            onChange={(e) =>
              setNewMedication({ ...newMedication, frequency: e.target.value })
            }
          />
          <label>Başlama Tarihi:</label>
          <input
            type="date"
            value={newMedication.startDate}
            onChange={(e) =>
              setNewMedication({ ...newMedication, startDate: e.target.value })
            }
          />
          <label>Bitiş Tarihi:</label>
          <input
            type="date"
            value={newMedication.endDate}
            onChange={(e) =>
              setNewMedication({ ...newMedication, endDate: e.target.value })
            }
          />
          <textarea
            placeholder="Notlar"
            value={newMedication.notes}
            onChange={(e) =>
              setNewMedication({ ...newMedication, notes: e.target.value })
            }
          ></textarea>
          <button type="submit">İlaç Tedavi Ekle</button>
        </form>
      </div>

      {/* ==================== 3. APPOINTMENTS ==================== */}
      <hr />
      <h3>Randevular</h3>
      {pet.appointments && pet.appointments.length > 0 ? (
        <ul>
          {pet.appointments.map((app, index) => (
            <li key={index}>
              <strong>
                {app.date
                  ? new Date(app.date).toLocaleDateString()
                  : "No Date"}{" "}
                - {app.time || "No Time"}
              </strong>
              {app.reason && ` (${app.reason})`}
              {app.location && ` @ ${app.location}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>Henüz randevu yok.</p>
      )}
      <div className="add-appointment">
        <h4>Randevu Ekle</h4>
        <form onSubmit={handleAddAppointment}>
          <label>Tarih:</label>
          <input
            type="date"
            value={newAppointment.date}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, date: e.target.value })
            }
            required
          />
          <label>Saat:</label>
          <input
            type="text"
            placeholder="SS:DD"
            value={newAppointment.time}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, time: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Sebep"
            value={newAppointment.reason}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, reason: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Konum"
            value={newAppointment.location}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, location: e.target.value })
            }
          />
          <button type="submit">Randevu Ekle</button>
        </form>
      </div>

      {/* ==================== 6. EMERGENCY CONTACTS ==================== */}
      <hr />
      <h3>Acil Durum Kişileri</h3>
      {pet.emergencyContacts && pet.emergencyContacts.length > 0 ? (
        <ul>
          {pet.emergencyContacts.map((ec, index) => (
            <li key={index}>
              <strong>{ec.name}</strong> ({ec.relationship}) - {ec.phone}
              {ec.address && ` - ${ec.address}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>Henüz acil durum kişisi yok.</p>
      )}
      <div className="add-emergency-contact">
        <h4>Acil Durum Kişisi Ekle</h4>
        <form onSubmit={handleAddEmergencyContact}>
          <input
            type="text"
            placeholder="Adı"
            value={newEmergencyContact.name}
            onChange={(e) =>
              setNewEmergencyContact({ ...newEmergencyContact, name: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="İlişkisi"
            value={newEmergencyContact.relationship}
            onChange={(e) =>
              setNewEmergencyContact({
                ...newEmergencyContact,
                relationship: e.target.value,
              })
            }
          />
          <input
            type="text"
            placeholder="Telefon"
            value={newEmergencyContact.phone}
            onChange={(e) =>
              setNewEmergencyContact({ ...newEmergencyContact, phone: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Adres"
            value={newEmergencyContact.address}
            onChange={(e) =>
              setNewEmergencyContact({
                ...newEmergencyContact,
                address: e.target.value,
              })
            }
          />
          <button type="submit">Acil Durum Kişisi Ekle</button>
        </form>
      </div>
    </div>
  );
};

export default PetDetails;
