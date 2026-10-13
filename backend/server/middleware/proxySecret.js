const { createHash, timingSafeEqual } = require('node:crypto');
const config = require('../config');

// Yayında API'ye yalnızca site (Vercel) üzerinden gelinebilsin: Vercel her /api isteğine gizli
// anahtarı X-Proxy-Secret başlığıyla ekler (frontend/vercel.json). Render adresine doğrudan gelen
// istekler bu anahtarı bilemez, reddedilir. Böylece kimse X-Forwarded-For'a sahte IP yazıp
// IP'ye dayalı sınırları (TRUST_PROXY) atlatamaz.
// Sağlık kontrolünü Render doğrudan yoklar; o yüzden anahtarsız açık kalır (veri döndürmez).
// PROXY_SECRET tanımlı değilse (geliştirme, testler) kontrol yapılmaz.

const digest = (value) => createHash('sha256').update(value).digest();

const requireProxySecret = (req, res, next) => {
  if (!config.proxySecret || req.path === '/api/health') return next();
  const given = req.get('x-proxy-secret');
  // Özetleri karşılaştırmak, uzunluk farkını da zamanlamadan gizler
  if (given && timingSafeEqual(digest(given), digest(config.proxySecret))) return next();
  res.status(403).json({ error: 'Forbidden' });
};

module.exports = requireProxySecret;
