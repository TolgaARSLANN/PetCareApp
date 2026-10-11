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

  test('suggests a scale when there is no weight history', () => {
    expect(getRecommendations({ species: 'kedi' })).toContain('Düzenli Ağırlık Takibi için Dijital Tartı');
  });
});
