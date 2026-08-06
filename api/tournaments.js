const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const raw = await kv.lrange('tournaments', 0, 19) || [];
  const tournaments = raw.map(t => typeof t === 'string' ? JSON.parse(t) : t);

  return res.json({ ok: true, tournaments });
};
