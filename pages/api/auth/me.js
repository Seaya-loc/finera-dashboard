import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.status(200).json({
    user: { email: user.email, name: user.name, role: user.role },
  });
}
