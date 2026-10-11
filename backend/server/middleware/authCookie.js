// Session cookie settings and token issuing, shared by the auth routes and the auth middleware.
const jwt = require('jsonwebtoken');
const config = require('../config');

const AUTH_COOKIE = 'token';

// httpOnly: page scripts cannot read the token, so an XSS bug cannot steal it.
// sameSite strict: the browser never sends it on cross-site requests (CSRF protection).
// path /api: only sent to the API, not with page or asset requests.
// secure in production: only sent over HTTPS.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.isProduction,
  path: '/api',
};

// Signs a token and puts it in an httpOnly cookie that expires together with the token.
// The token is never returned in the body, so page scripts never see it.
// - tv: the user's session version; the token stops working once it is bumped
// - at: when the user logged in (seconds); a sliding session never outlives sessionMaxDays from it
function issueSession(res, { userId, tokenVersion = 0, authTime = Math.floor(Date.now() / 1000) }) {
  const token = jwt.sign({ userId, tv: tokenVersion, at: authTime }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: new Date(exp * 1000) });
}

module.exports = { AUTH_COOKIE, cookieOptions, issueSession };
