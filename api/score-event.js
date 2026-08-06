const { kv } = require('@vercel/kv');

const PTS = [0, 100, 300, 500, 800];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { sessionToken, lines, level } = req.body || {};
  if (!sessionToken) return res.json({ ok: false });

  const raw = await kv.get(`session:${sessionToken}`);
  if (!raw) return res.json({ ok: false, error: 'Sesión no encontrada' });

  const session = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // El servidor calcula los puntos (no el cliente): evita manipulación
  const pts = (PTS[Math.min(lines, 4)] || 800) * (level || 1);
  session.score += pts;
  session.lines  = (session.lines || 0) + (lines || 0);
  session.level  = level || session.level;

  await kv.set(`session:${sessionToken}`, JSON.stringify(session), { ex: 7200 });

  return res.json({ ok: true });
};
