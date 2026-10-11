const { rateLimit } = require('express-rate-limit');
const config = require('../config');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Brute-force protection for login and register. Only failed attempts count,
// so a user who logs in successfully is never locked out by their own logins.
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: config.authRateLimit,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

// Generous overall limit against scripted abuse of the API
const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: config.apiRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

module.exports = { authLimiter, apiLimiter };
