import React from "react";
import { Bird, Cat, Dog, PawPrint } from "@phosphor-icons/react";

const ICONS = { kedi: Cat, köpek: Dog, kuş: Bird };

const SpeciesIcon = ({ species, size = 24, ...rest }) => {
  const Icon = ICONS[(species || "").toLocaleLowerCase("tr-TR")] || PawPrint;
  return <Icon size={size} weight="duotone" aria-hidden="true" {...rest} />;
};

export default SpeciesIcon;
