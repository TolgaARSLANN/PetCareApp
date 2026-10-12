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

// Blog cover photo uploads per logged-in user (not per IP, so one account cannot spread uploads
// over many addresses, and people sharing an IP do not block each other). Counted in memory, so
// uploading and then deleting posts does not get around it. Requests without a photo and failed
// requests do not count. Must run after authMiddleware and the body parser.
const photoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.photoUploadsPerHour,
  keyGenerator: (req) => `user:${req.userId}`,
  skip: (req) => !req.body?.imageData,
  skipFailedRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many photo uploads, please try again later' },
});

// Photo downloads per IP (see config.imageRateLimit)
const imageLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: config.imageRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

module.exports = { authLimiter, apiLimiter, photoUploadLimiter, imageLimiter };
