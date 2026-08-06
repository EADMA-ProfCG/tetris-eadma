const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2026';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { password, archive, tournamentName } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.json({ ok: false, error: 'Contraseña incorrecta' });

  if (archive) {
    const scoresRaw = await kv.hgetall('scores') || {};
    const entries = Object.entries(scoresRaw)
      .map(([name, v]) => {
        const e = typeof v === 'string' ? JSON.parse(v) : v;
        return [name, e?.score ?? (typeof e === 'number' ? e : 0)];
      })
      .sort((a, b) => b[1] - a[1]);

    const tournament = {
      name: tournamentName || new Date().toLocaleDateString('es-CL'),
      date: new Date().toISOString(),
      podium: entries.slice(0, 3).map(([name, score]) => ({ name, score })),
      totalPlayers: entries.length
    };

    await kv.lpush('tournaments', JSON.stringify(tournament));
    await kv.ltrim('tournaments', 0, 19); // mantener últimos 20
  }

  await kv.del('scores');
  await kv.del('suspicious');

  return res.json({ ok: true });
};
