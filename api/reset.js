const { redis, hgetallToObj, parseVal } = require('./_redis');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2026';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { password, archive, tournamentName } = req.body || {};
    if (password !== ADMIN_PASSWORD) return res.json({ ok: false, error: 'Contraseña incorrecta' });

    if (archive) {
      const scoresRaw = hgetallToObj(await redis('HGETALL', 'scores'));
      const entries   = Object.entries(scoresRaw)
        .map(([name, v]) => { const e = parseVal(v); return [name, e?.score ?? (typeof e === 'number' ? e : 0)]; })
        .sort((a, b) => b[1] - a[1]);
      await redis('LPUSH', 'tournaments', JSON.stringify({
        name: tournamentName || new Date().toLocaleDateString('es-CL'),
        date: new Date().toISOString(),
        podium: entries.slice(0, 3).map(([name, score]) => ({ name, score })),
        totalPlayers: entries.length
      }));
      await redis('LTRIM', 'tournaments', 0, 19);
    }

    await redis('DEL', 'scores');
    await redis('DEL', 'suspicious');
    return res.json({ ok: true });
  } catch(e) {
    console.error('reset error:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
};
