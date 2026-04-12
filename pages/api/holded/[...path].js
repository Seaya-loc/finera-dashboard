// Proxy API route for Holded - avoids CORS issues
const HOLDED_API_KEY = process.env.HOLDED_API_KEY || 'f483bffd49306706b9d00d24932cb673';
const HOLDED_BASE = 'https://api.holded.com/api';

export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;

  // Build query string from remaining params
  const params = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') params.append(key, value);
  });
  const qs = params.toString() ? `?${params.toString()}` : '';

  const url = `${HOLDED_BASE}/${apiPath}${qs}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'key': HOLDED_API_KEY,
        'Content-Type': 'application/json',
      },
      ...(req.method !== 'GET' && req.body ? { body: JSON.stringify(req.body) } : {}),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Holded API error:', error);
    res.status(500).json({ error: 'Error connecting to Holded API', details: error.message });
  }
}
