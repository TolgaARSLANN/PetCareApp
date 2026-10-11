const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const { AUTH_COOKIE, issueSession } = require('./authCookie');

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

// Sliding session: once half of the token's lifetime has passed, the next request gets a fresh
// cookie, so an active user is not logged out mid-task while an idle session still expires.
// The login time ("at") is carried over and the session stops sliding sessionMaxDays after it.
// Only for the browser's cookie; API clients sending a Bearer header manage their own tokens.
function refreshIfAging(req, res, decoded) {
  if (!req.cookies?.[AUTH_COOKIE] || !decoded.exp || !decoded.iat) return;
  const now = Math.floor(Date.now() / 1000);
  const lifetime = decoded.exp - decoded.iat;
  if (decoded.exp - now > lifetime / 2) return;
  const authTime = decoded.at ?? decoded.iat; // tokens issued before "at" existed
  if (now - authTime >= config.sessionMaxDays * 24 * 60 * 60) return;
  issueSession(res, { userId: decoded.userId, tokenVersion: decoded.tv || 0, authTime });
}

// Returns the logged-in user's id, or null when there is no valid session.
// Pass res to also slide the session (see refreshIfAging).
async function getUserId(req, res) {
  const token = readToken(req);
  if (!token) return null;
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
  if (!(await isSessionCurrent(decoded.userId, decoded.tv))) return null;
  if (res) refreshIfAging(req, res, decoded);
  return decoded.userId;
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
  refreshIfAging(req, res, decoded);
  next();
}

module.exports = authMiddleware;
module.exports.getUserId = getUserId;
