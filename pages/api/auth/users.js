import { getUserFromRequest, getUsers } from '../../../lib/auth';

export default async function handler(req, res) {
  const currentUser = await getUserFromRequest(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden gestionar usuarios' });
  }

  if (req.method === 'GET') {
    const users = getUsers().map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
    }));
    return res.status(200).json({ users });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
