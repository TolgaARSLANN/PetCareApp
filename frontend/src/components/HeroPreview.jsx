import React from "react";
import { CalendarCheck, Cat, Dog, Syringe, TrendUp } from "@phosphor-icons/react";

// Ana sayfadaki ürün önizlemesi: uygulamanın kendi kartlarından (evcil dost kartı, kilo grafiği,
// aşı hatırlatması, randevu) bir kompozisyon. Stok fotoğraf yerine ürünü gösterir; tasarım
// değişkenlerini kullandığı için açık ve karanlık temaya kendiliğinden uyar.
// Örnek veriler gerçek değildir; ekran okuyucular için gizlidir (başlık ve metin ürünü zaten anlatır).
// Tarihler göreli yazılır ("5 gün sonra"), böylece önizleme zamanla eskimez.

// Kilo grafiği: yumuşak artan bir eğri (viewBox 0 0 240 64)
const WEIGHT_POINTS = [
  [0, 46],
  [40, 42],
  [80, 44],
  [120, 34],
  [160, 30],
  [200, 24],
  [240, 18],
];
const line = WEIGHT_POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
const area = `${line} L240 64 L0 64 Z`;

const HeroPreview = () => (
  <div className="hero-preview" aria-hidden="true">
    <div className="hero-preview-backdrop" />

    <div className="card hp-card hp-main">
      <div className="hp-pet">
        <span className="avatar avatar-kedi">
          <Cat size={28} weight="duotone" />
        </span>
        <div>
          <p className="hp-pet-name">Pamuk</p>
          <p className="hp-muted">Kedi · 3 yaşında</p>
        </div>
        <span className="badge badge-success hp-pet-badge">Aşıları güncel</span>
      </div>

      <div className="hp-stats">
        <div className="hp-stat">
          <span className="hp-muted">Son kilo</span>
          <strong>4,5 kg</strong>
        </div>
        <div className="hp-stat">
          <span className="hp-muted">Değişim</span>
          <strong className="hp-trend">
            <TrendUp size={16} weight="bold" />
            +0,3 kg
          </strong>
        </div>
      </div>

      <div className="hp-chart">
        <span className="hp-muted">Kilo geçmişi</span>
        <svg viewBox="0 0 240 64" preserveAspectRatio="none" role="presentation" focusable="false">
          <path d={area} className="hp-chart-area" />
          <path d={line} className="hp-chart-line" />
          <circle cx="240" cy="18" r="4" className="hp-chart-dot" />
        </svg>
      </div>
    </div>

    <div className="card hp-card hp-float hp-reminder">
      <span className="icon-tile icon-tile-accent">
        <Syringe size={22} weight="duotone" />
      </span>
      <div>
        <p className="hp-float-title">Kuduz aşısı tekrarı</p>
        <p className="hp-muted">Pamuk · 5 gün sonra</p>
      </div>
      <span className="badge badge-warning">Yaklaşıyor</span>
    </div>

    <div className="card hp-card hp-float hp-appointment">
      <span className="avatar avatar-köpek hp-mini-avatar">
        <Dog size={20} weight="duotone" />
      </span>
      <div>
        <p className="hp-float-title">
          <CalendarCheck size={16} weight="bold" /> Kontrol randevusu
        </p>
        <p className="hp-muted">Boncuk · Yarın 10:30</p>
      </div>
    </div>
  </div>
);

export default HeroPreview;
