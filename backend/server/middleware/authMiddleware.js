const jwt = require('jsonwebtoken');
const config = require('../config');
const { AUTH_COOKIE } = require('./authCookie');

// The browser app sends the token in an httpOnly cookie; other API clients
// (and the tests) may still send it as "Authorization: Bearer <token>".
const readToken = (req) => req.cookies?.[AUTH_COOKIE] || req.headers.authorization?.split(' ')[1];

// Returns the logged-in user's id, or null when there is no valid session
function getUserId(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret).userId;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authMiddleware;
module.exports.getUserId = getUserId;
