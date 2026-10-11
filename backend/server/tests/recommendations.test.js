const { getRecommendations } = require('../services/recommendations');

describe('getRecommendations', () => {
  test('matches species regardless of case', () => {
    expect(getRecommendations({ species: 'Kedi' })).toContain('Kedi Tırmalama Tahtası');
    expect(getRecommendations({ species: 'KÖPEK' })).toContain('Diş Temizleme Çubuğu');
  });

  test('does not suggest a diet for a healthy 15 kg dog', () => {
    const recs = getRecommendations({ species: 'köpek', weightHistory: [{ weight: 15 }] });
    expect(recs.some((r) => r.includes('Düşük Kalorili'))).toBe(false);
  });

  test('flags an overweight cat', () => {
    const recs = getRecommendations({ species: 'kedi', weightHistory: [{ weight: 8 }] });
    expect(recs.some((r) => r.includes('Düşük Kalorili'))).toBe(true);
  });

  test('flags a weight change of 10% or more for any species', () => {
    const recs = getRecommendations({ species: 'kuş', weightHistory: [{ weight: 0.1 }, { weight: 0.08 }] });
    expect(recs).toContain('Belirgin Kilo Değişimi: Veteriner Kontrolü Önerilir');
  });

  test('uses the most recent weight by date, not the last one added', () => {
    // 8 kg (fazla kilolu) eski bir ölçüm sonradan eklenmiş; en yeni ölçüm 4 kg
    const recs = getRecommendations({
      species: 'kedi',
      weightHistory: [
        { date: '2026-10-01', weight: 4 },
        { date: '2025-01-01', weight: 8 },
      ],
    });
    expect(recs.some((r) => r.includes('Düşük Kalorili'))).toBe(false);
  });

  test('compares the two most recent weights by date', () => {
    // Eklenme sırasına göre 4 -> 4.1 (değişim yok gibi), tarihe göre 2.5 -> 4 (belirgin artış)
    const recs = getRecommendations({
      species: 'kedi',
      weightHistory: [
        { date: '2026-10-01', weight: 4 },
        { date: '2026-01-01', weight: 4.1 },
        { date: '2026-09-01', weight: 2.5 },
      ],
    });
    expect(recs).toContain('Belirgin Kilo Değişimi: Veteriner Kontrolü Önerilir');
  });

  test('quotes the most recent health record by date', () => {
    const recs = getRecommendations({
      species: 'kedi',
      healthRecords: [
        { date: '2026-09-02', notes: 'Yeni not' },
        { date: '2026-03-10', notes: 'Eski not' },
      ],
    });
    expect(recs).toContain('Son sağlık kontrolü notlarına dikkat edin: Yeni not');
  });

  test('suggests a scale when there is no weight history', () => {
    expect(getRecommendations({ species: 'kedi' })).toContain('Düzenli Ağırlık Takibi için Dijital Tartı');
  });
});
