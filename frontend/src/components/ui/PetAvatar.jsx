import React, { useState } from "react";
import SpeciesIcon from "./SpeciesIcon";

// Evcil dostun yuvarlak görseli: fotoğrafı varsa fotoğraf, yoksa (ya da yüklenemezse) tür simgesi.
// Ad hemen yanında yazdığı için görsel süs sayılır (alt="").
const PetAvatar = ({ pet, large = false }) => {
  const [failed, setFailed] = useState(false);
  const species = pet.species || "diğer";
  const className = ["avatar", large && "avatar-lg", `avatar-${species}`].filter(Boolean).join(" ");

  if (pet.photo && !failed) {
    return (
      <span className={`${className} avatar-photo`}>
        <img src={pet.photo} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span className={className}>
      <SpeciesIcon species={pet.species} size={large ? 40 : 28} />
    </span>
  );
};

export default PetAvatar;
