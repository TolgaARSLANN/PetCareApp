import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, PawPrint, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import API from "../services/api";
import PetForm from "./PetForm";
import UpcomingPanel from "./UpcomingPanel";
import Alert from "./ui/Alert";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import { SkeletonCards } from "./ui/Loading";
import SpeciesIcon from "./ui/SpeciesIcon";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { capitalizeTr, formatDate, petAge } from "../utils/format";

const PetList = () => {
  useDocumentTitle("Evcil Dostlarım");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Listeyi yeniden çekmek için artırılır (tekrar dene)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    API.get("/pets")
      .then(({ data }) => {
        if (ignore) return;
        setLoadError("");
        setPets(data);
      })
      .catch((error) => {
        if (ignore) return;
        console.error(error);
        setLoadError("Evcil dostlarınız yüklenemedi.");
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoadError("");
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const openNewForm = () => {
    setSelectedPet(null);
    setFormOpen(true);
    setNotice("");
  };

  const openEditForm = (pet) => {
    setSelectedPet(pet);
    setFormOpen(true);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedPet(null);
  };

  const handleSaved = (pet, isUpdate) => {
    setPets((current) => (isUpdate ? current.map((p) => (p._id === pet._id ? pet : p)) : [...current, pet]));
    setNotice(isUpdate ? `${pet.name} güncellendi.` : `${pet.name} eklendi.`);
    closeForm();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await API.delete(`/pets/${toDelete._id}`);
      setPets((current) => current.filter((pet) => pet._id !== toDelete._id));
      setNotice(`${toDelete.name} silindi.`);
      setToDelete(null);
    } catch (error) {
      console.error(error);
      setDeleteError("Silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Evcil Dostlarım</h1>
          <p className="page-subtitle">
            {loading
              ? "Kayıtlar yükleniyor…"
              : pets.length
                ? `${pets.length} evcil dost kayıtlı`
                : "Henüz evcil dost eklemediniz"}
          </p>
        </div>
        {!formOpen && pets.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={openNewForm}>
            <Plus size={18} weight="bold" aria-hidden="true" />
            Evcil dost ekle
          </button>
        )}
      </header>

      {notice && (
        <Alert type="success" onClose={() => setNotice("")} className="mb-4">
          {notice}
        </Alert>
      )}

      {formOpen && (
        <div className="mb-6">
          <PetForm
            // Düzenlenen hayvan değişince form sıfırdan kurulur (değerleri efektle kopyalamak yerine)
            key={selectedPet?._id ?? "new"}
            selectedPet={selectedPet}
            onSaved={handleSaved}
            onCancel={closeForm}
          />
        </div>
      )}

      {!loading && !loadError && pets.length > 0 && <UpcomingPanel pets={pets} />}

      {loading ? (
        <SkeletonCards count={3} label="Evcil dostlar yükleniyor" />
      ) : loadError ? (
        <Alert type="error">
          {loadError}{" "}
          <button type="button" className="link-button" onClick={retry}>
            Tekrar dene
          </button>
        </Alert>
      ) : pets.length === 0 ? (
        !formOpen && (
          <EmptyState
            icon={PawPrint}
            title="İlk evcil dostunuzu ekleyin"
            description="Adını, türünü ve doğum tarihini girin; sağlık kayıtlarını ve randevularını buradan takip edin."
            action={
              <button type="button" className="btn btn-primary" onClick={openNewForm}>
                <Plus size={18} weight="bold" aria-hidden="true" />
                Evcil dost ekle
              </button>
            }
          />
        )
      ) : (
        <ul className="card-grid" aria-label="Evcil dostlar">
          {pets.map((pet) => {
            const age = petAge(pet.birthDate);
            return (
              <li key={pet._id} className="card pet-card">
                <div className="pet-card-head">
                  <span className={`avatar avatar-${pet.species || "diğer"}`}>
                    <SpeciesIcon species={pet.species} size={28} />
                  </span>
                  <div className="pet-card-heading">
                    <h2 className="pet-card-name">{pet.name}</h2>
                    <span className="badge">{capitalizeTr(pet.species) || "Belirtilmemiş"}</span>
                  </div>
                </div>
                <dl className="meta-list">
                  <div>
                    <dt>Yaş</dt>
                    <dd>{age || "-"}</dd>
                  </div>
                  <div>
                    <dt>Doğum tarihi</dt>
                    <dd>{formatDate(pet.birthDate)}</dd>
                  </div>
                </dl>
                <div className="pet-card-actions">
                  <Link to={`/pets/${pet._id}`} className="btn btn-primary btn-sm">
                    Sağlık defteri
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <div className="icon-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => openEditForm(pet)}
                      aria-label={`${pet.name} bilgilerini düzenle`}
                      title="Düzenle"
                    >
                      <PencilSimple size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      onClick={() => {
                        setDeleteError("");
                        setToDelete(pet);
                      }}
                      aria-label={`${pet.name} kaydını sil`}
                      title="Sil"
                    >
                      <Trash size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`${toDelete?.name || ""} silinsin mi?`}
        message="Bu evcil dosta ait tüm kayıtlar (sağlık, aşı, kilo, ilaç, randevu ve acil durum kişileri) da silinir. Bu işlem geri alınamaz."
        confirmLabel="Evet, sil"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default PetList;
