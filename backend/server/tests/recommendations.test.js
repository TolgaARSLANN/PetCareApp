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

  describe('vaccines', () => {
    const NOW = new Date('2026-10-11T12:00:00');
    const recsFor = (vaccines) => getRecommendations({ species: 'kedi', vaccines }, NOW);

    test('suggests planning vaccines when there are none', () => {
      expect(recsFor([])).toContain('Aşı Takvimini Veterinerinizle Planlayın');
    });

    test('flags an overdue booster', () => {
      const recs = recsFor([{ vaccineName: 'Kuduz', vaccineDate: '2025-09-01', nextDueDate: '2026-09-01' }]);
      expect(recs).toContain('Kuduz aşısının tekrar tarihi geçti (1 Eylül 2026): veterinerinizden randevu alın');
    });

    test('flags a booster due within 30 days', () => {
      const recs = recsFor([{ vaccineName: 'Karma', vaccineDate: '2025-10-24', nextDueDate: '2026-10-24' }]);
      expect(recs).toContain('Karma aşısının tekrar tarihi yaklaşıyor (24 Ekim 2026)');
    });

    test('ignores boosters further away and vaccines without a due date', () => {
      const recs = recsFor([
        { vaccineName: 'Karma', vaccineDate: '2026-10-01', nextDueDate: '2027-10-01' },
        { vaccineName: 'İç parazit', vaccineDate: '2026-09-01' },
      ]);
      expect(recs.some((r) => r.includes('aşısının'))).toBe(false);
    });

    test('a renewed vaccine is not flagged by its old record', () => {
      // 2025 kaydının tekrar tarihi geçmiş, ama aşı 2026'da yenilenmiş (ad farklı yazılmış olsa da)
      const recs = recsFor([
        { vaccineName: 'Kuduz', vaccineDate: '2025-09-01', nextDueDate: '2026-09-01' },
        { vaccineName: ' kuduz ', vaccineDate: '2026-09-05', nextDueDate: '2027-09-05' },
      ]);
      expect(recs.some((r) => r.includes('tekrar tarihi'))).toBe(false);
    });

    test('works with Mongoose subdocuments', () => {
      const Pet = require('../models/Pet');
      const pet = new Pet({
        name: 'Pamuk',
        ownerId: '507f1f77bcf86cd799439011',
        vaccines: [{ vaccineName: 'Kuduz', vaccineDate: '2025-09-01', nextDueDate: '2026-09-01' }],
      });
      expect(getRecommendations(pet, NOW).some((r) => r.startsWith('Kuduz aşısının tekrar tarihi geçti'))).toBe(true);
    });
  });

  test('suggests a scale when there is no weight history', () => {
    expect(getRecommendations({ species: 'kedi' })).toContain('Düzenli Ağırlık Takibi için Dijital Tartı');
  });
});
