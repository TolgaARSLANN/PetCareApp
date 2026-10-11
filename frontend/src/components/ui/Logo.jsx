import React from "react";
import { PawPrint } from "@phosphor-icons/react";

const Logo = ({ light = false }) => (
  <span className={`logo ${light ? "logo-light" : ""}`}>
    <span className="logo-mark">
      <PawPrint size={20} weight="fill" aria-hidden="true" />
    </span>
    <span className="logo-text">
      Pawfect<span className="logo-accent">Care</span>
    </span>
  </span>
);

export default Logo;
