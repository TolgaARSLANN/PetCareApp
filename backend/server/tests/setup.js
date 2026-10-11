// Testler gerçek .env veya veritabanı gerektirmez
process.env.JWT_SECRET = 'test-secret';
// Testler aynı IP'den çok sayıda başarısız istek yapar; deneme sınırı yalnızca kendi testinde düşük tutulur
process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT || '1000';
