// Session cookie settings, shared by login, logout and the auth middleware.
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

module.exports = { AUTH_COOKIE, cookieOptions };
