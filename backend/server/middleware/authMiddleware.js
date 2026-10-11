const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const { AUTH_COOKIE } = require('./authCookie');

// The browser app sends the token in an httpOnly cookie; other API clients
// (and the tests) may still send it as "Authorization: Bearer <token>".
const readToken = (req) => req.cookies?.[AUTH_COOKIE] || req.headers.authorization?.split(' ')[1];

// A token is only valid while its session version ("tv") matches the user's current one.
// Bumping User.tokenVersion therefore signs out every device at once. This costs one small
// indexed lookup per request, which also rejects tokens of deleted accounts.
async function isSessionCurrent(userId, tokenVersion = 0) {
  if (!mongoose.isValidObjectId(userId)) return false;
  // Accounts created before session versions existed have no tokenVersion field (null matches it)
  const version = tokenVersion === 0 ? { $in: [0, null] } : tokenVersion;
  return Boolean(await User.exists({ _id: userId, tokenVersion: version }));
}

// Returns the logged-in user's id, or null when there is no valid session
async function getUserId(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const { userId, tv } = jwt.verify(token, config.jwtSecret);
    return (await isSessionCurrent(userId, tv)) ? userId : null;
  } catch {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'No token' });

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    if (!(await isSessionCurrent(decoded.userId, decoded.tv))) {
      return res.status(401).json({ message: 'Session ended' });
    }
  } catch (error) {
    console.error('Error checking session:', error);
    return res.status(500).json({ message: 'Server error' });
  }
  req.userId = decoded.userId;
  next();
}

module.exports = authMiddleware;
module.exports.getUserId = getUserId;
