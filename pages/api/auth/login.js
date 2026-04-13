import { findUser, validatePassword, createToken, setTokenCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = findUser(email);
  if (!user || !validatePassword(user, password)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = await createToken({
    email: user.email,
    name: user.name,
    role: user.role,
  });

  setTokenCookie(res, token);

  return res.status(200).json({
    user: { email: user.email, name: user.name, role: user.role },
  });
}
