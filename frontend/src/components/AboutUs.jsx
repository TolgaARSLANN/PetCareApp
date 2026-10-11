import React from "react";
import "./AboutUs.css"; // CSS dosyasını import ediyoruz.

const AboutUs = () => {
  return (
    <div className="about-us">
      <div className="about-container">
        <h1>Pawfect Care</h1>
        <p>
          Tüylü dostlarınızın refahını sağlamada güvenilir yoldaşınız Pawfect Care'e hoş geldiniz.
          Misyonumuz, yenilikçi çözümler, profesyonel tavsiyeler ve dost canlısı bir topluluk aracılığıyla evcil hayvanlarınıza kapsamlı ve şefkatli bir bakım sağlamaktır.
        </p>
        <p>
          Eğitim programlarından sağlık takibine kadar, evcil hayvanlarınıza mümkün olan en iyi hayatı sunmada ortağınız olmaya çalışıyoruz.
        </p>
        <h2>Vizyonumuz</h2>
        <p>
          Her evcil hayvanın hak ettiği sevgiyi, bakımı ve ilgiyi gördüğü bir dünya yaratmak.
        </p>
        <h2>Misyonumuz</h2>
        <p>
          Evcil hayvan sahiplerine, evcil hayvanlarının hayatlarını iyileştirmek için ihtiyaç duydukları araç ve bilgiyi sağlayarak onları güçlendirmek.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
