const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2026';
function parseVal(v){try{return typeof v==='string'?JSON.parse(v):v;}catch(e){return v;}}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { password, archive, tournamentName } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.json({ ok: false, error: 'Contraseña incorrecta' });

  if (archive) {
    const scoresRaw = await redis.hgetall('scores') || {};
    const entries = Object.entries(scoresRaw)
      .map(([name, v]) => { const e = parseVal(v); return [name, e?.score ?? (typeof e === 'number' ? e : 0)]; })
      .sort((a, b) => b[1] - a[1]);

    await redis.lpush('tournaments', JSON.stringify({
      name: tournamentName || new Date().toLocaleDateString('es-CL'),
      date: new Date().toISOString(),
      podium: entries.slice(0, 3).map(([name, score]) => ({ name, score })),
      totalPlayers: entries.length
    }));
    await redis.ltrim('tournaments', 0, 19);
  }

  await redis.del('scores');
  await redis.del('suspicious');
  return res.json({ ok: true });
};
