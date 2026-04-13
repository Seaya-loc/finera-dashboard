import { clearTokenCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  clearTokenCookie(res);
  return res.status(200).json({ ok: true });
}
