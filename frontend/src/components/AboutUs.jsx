import React from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, Target } from "@phosphor-icons/react";
import useDocumentTitle from "../hooks/useDocumentTitle";

const VALUES = [
  {
    icon: Eye,
    title: "Vizyonumuz",
    text: "Her evcil hayvanın hak ettiği sevgiyi, bakımı ve ilgiyi gördüğü bir dünya yaratmak.",
  },
  {
    icon: Target,
    title: "Misyonumuz",
    text: "Evcil hayvan sahiplerine, dostlarının hayatını iyileştirmek için ihtiyaç duydukları araç ve bilgiyi sağlamak.",
  },
  {
    icon: Heart,
    title: "Değerlerimiz",
    text: "Şefkat, şeffaflık ve sadelik. Bakımı zorlaştıran değil, kolaylaştıran bir deneyim sunmak.",
  },
];

const AboutUs = () => {
  useDocumentTitle("Hakkımızda");
  return (
    <div className="page">
      <div className="container container-narrow">
        <header className="page-intro">
          <p className="eyebrow">Hakkımızda</p>
          <h1 className="page-title">Tüylü dostlarınızın güvenilir yol arkadaşı</h1>
          <p className="page-lead">
            Pawfect Care, evcil hayvanlarınıza kapsamlı ve şefkatli bir bakım sunabilmeniz için tasarlandı. Sağlık
            takibinden bakım önerilerine kadar, dostunuza mümkün olan en iyi hayatı sunmanızda yanınızdayız.
          </p>
        </header>
      </div>
      <div className="container">
        <ul className="value-grid">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card value-card">
              <span className="icon-tile">
                <Icon size={24} weight="duotone" aria-hidden="true" />
              </span>
              <h2 className="feature-title">{title}</h2>
              <p className="feature-text">{text}</p>
            </li>
          ))}
        </ul>
        <div className="about-cta">
          <p>Dostunuzun sağlık defterini oluşturmaya hazır mısınız?</p>
          <Link to="/register" className="btn btn-primary">
            Ücretsiz üye olun
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
