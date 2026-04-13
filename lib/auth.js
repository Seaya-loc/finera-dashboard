// Simple JWT-based auth utilities
// Uses HMAC-SHA256 for token signing (no external dependencies)

const JWT_SECRET = process.env.JWT_SECRET || 'finera-dashboard-secret-change-me';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Base64url helpers ──
function base64urlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

// ── HMAC-SHA256 ──
async function hmacSign(message) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', JWT_SECRET).update(message).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ── Create JWT ──
export async function createToken(payload) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64urlEncode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY,
  }));
  const signature = await hmacSign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

// ── Verify JWT ──
export async function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expected = await hmacSign(`${header}.${body}`);
    if (expected !== signature) return null;

    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// ── Get user from request cookies ──
export async function getUserFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/finera_token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}

// ── Cookie helpers ──
export function setTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `finera_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_EXPIRY}${isProduction ? '; Secure' : ''}`
  );
}

export function clearTokenCookie(res) {
  res.setHeader('Set-Cookie',
    'finera_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
}

// ── User store ──
// Users are stored in DASHBOARD_USERS env var as JSON array:
// [{"email":"loc@seaya.vc","name":"Lara","password":"xxx","role":"admin"}]
// Role can be "admin" or "viewer"

let cachedUsers = null;

export function getUsers() {
  if (cachedUsers) return cachedUsers;
  try {
    const raw = process.env.DASHBOARD_USERS;
    if (!raw) return getDefaultUsers();
    cachedUsers = JSON.parse(raw);
    return cachedUsers;
  } catch {
    return getDefaultUsers();
  }
}

function getDefaultUsers() {
  return [
    { email: 'loc@seaya.vc', name: 'Lara Ortega', password: 'finera2026', role: 'admin' },
  ];
}

export function findUser(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function validatePassword(user, password) {
  return user.password === password;
}
