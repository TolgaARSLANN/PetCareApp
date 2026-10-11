// server/config.js
// Loads settings from environment variables (.env in development).

require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pet_care_db',
  jwtSecret: process.env.JWT_SECRET,
  // Oturum hareketsiz kalırsa bu sürede kapanır; kullanıldıkça kendiliğinden uzar (kayan oturum)
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Kayan oturum en fazla bu kadar gün uzar; sonra yeniden giriş gerekir
  sessionMaxDays: Number(process.env.SESSION_MAX_DAYS) || 30,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',

  // Failed login / register attempts allowed per IP in a 15-minute window
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  // All API requests allowed per IP in a 15-minute window. Kept generous because
  // many users can share one IP (offices, schools, mobile carriers).
  apiRateLimit: Number(process.env.API_RATE_LIMIT) || 1000,
  // Number of reverse proxies in front of the API (so rate limits see the real client IP).
  // 0 when the API is reached directly, e.g. 1 behind Render / Railway / a Vercel rewrite.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
};

if (!config.jwtSecret) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

module.exports = config;
