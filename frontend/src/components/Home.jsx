import React from "react";
import { Link, useLocation } from "react-router-dom";
import Alert from "./ui/Alert";
import {
  ArrowRight,
  CalendarCheck,
  FirstAidKit,
  Lightbulb,
  Pill,
  Scales,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../context/useAuth";
import heroLarge from "../assets/hero-pets.jpg";
import heroSmall from "../assets/hero-pets-sm.jpg";

const FEATURES = [
  {
    icon: FirstAidKit,
    title: "Sağlık kayıtları",
    text: "Veteriner ziyaretlerini, aşıları ve tekrar tarihlerini tek yerde saklayın.",
  },
  {
    icon: Scales,
    title: "Kilo takibi",
    text: "Kilo değişimlerini kaydedin, ani artış ve düşüşleri erkenden fark edin.",
  },
  {
    icon: Pill,
    title: "İlaç tedavileri",
    text: "Doz, sıklık ve tedavi tarihlerini unutmadan tek yerde tutun.",
  },
  {
    icon: CalendarCheck,
    title: "Randevular",
    text: "Yaklaşan kontrol ve aşı randevularını saatiyle birlikte görün.",
  },
  {
    icon: Lightbulb,
    title: "Kişiye özel öneriler",
    text: "Türüne ve eklediğiniz kayıtlara göre dostunuz için bakım önerileri alın.",
  },
  {
    icon: UsersThree,
    title: "Topluluk blogu",
    text: "Diğer evcil hayvan sahipleriyle deneyim ve ipuçlarını paylaşın.",
  },
];

const STEPS = [
  { title: "Ücretsiz üye olun", text: "E-posta adresinizle saniyeler içinde hesap oluşturun." },
  { title: "Dostunuzu ekleyin", text: "Adını, türünü ve doğum tarihini girin." },
  { title: "Takibe başlayın", text: "Sağlık, ilaç ve randevu kayıtlarını ekledikçe tüm geçmiş elinizin altında." },
];

const Home = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  useDocumentTitle(null);
  const primaryCta = isLoggedIn
    ? { to: "/pets", label: "Evcil dostlarıma git" }
    : { to: "/register", label: "Ücretsiz başlayın" };

  return (
    <>
      {location.state?.accountDeleted && (
        <div className="container home-notice">
          <Alert type="success">Hesabınız ve tüm verileriniz kalıcı olarak silindi.</Alert>
        </div>
      )}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">
              <ShieldCheck size={18} weight="fill" aria-hidden="true" />
              Evcil hayvan sağlık asistanı
            </p>
            <h1 className="hero-title">
              Dostunuzun sağlığı, <span className="text-gradient">tek bir yerde.</span>
            </h1>
            <p className="hero-lead">
              Aşılar, ilaçlar, kilo ve randevular… Pawfect Care evcil dostunuzla ilgili her şeyi düzenli tutar,
              size de sadece sevmek kalır.
            </p>
            <div className="hero-actions">
              <Link to={primaryCta.to} className="btn btn-primary btn-lg">
                {primaryCta.label}
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link to="/blogs" className="btn btn-secondary btn-lg">
                Blogu keşfedin
              </Link>
            </div>
          </div>
          <div className="hero-media">
            <img
              src={heroLarge}
              srcSet={`${heroSmall} 800w, ${heroLarge} 1400w`}
              sizes="(max-width: 900px) 100vw, 560px"
              width="1400"
              height="700"
              alt="Pembe bir fon önünde yan yana oturan iki kedi, bir kaniş ve bir corgi"
              fetchpriority="high"
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">Neler sunuyoruz</p>
            <h2 id="features-title" className="section-title">
              Bakımın her adımı için bir araç
            </h2>
            <p className="section-lead">
              Kâğıt notlar ve dağınık mesajlar yerine, dostunuzun tüm sağlık geçmişi düzenli ve her an ulaşılabilir.
            </p>
          </div>
          <ul className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card feature-card">
                <span className="icon-tile">
                  <Icon size={24} weight="duotone" aria-hidden="true" />
                </span>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-text">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-muted" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">Nasıl çalışır</p>
            <h2 id="steps-title" className="section-title">
              Üç adımda başlayın
            </h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!isLoggedIn && (
        <section className="section">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2 className="cta-title">Dostunuzun sağlık defterini bugün açın</h2>
                <p className="cta-text">Üyelik ücretsiz. Dilediğiniz kadar evcil dost ekleyebilirsiniz.</p>
              </div>
              <Link to="/register" className="btn btn-light btn-lg">
                Hemen üye olun
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
