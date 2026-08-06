const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2026';
function parseVal(v){try{return typeof v==='string'?JSON.parse(v):v;}catch(e){return v;}}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { password, action, ...extra } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.json({ ok: false, error: 'Contraseña incorrecta' });

  if (action === 'getData') {
    const scoresRaw = await redis.hgetall('scores') || {};
    const scores = {};
    for (const [k, v] of Object.entries(scoresRaw)) scores[k] = parseVal(v);

    const suspRaw = await redis.lrange('suspicious', 0, 49) || [];
    const suspicious = suspRaw.map(parseVal);

    const bannedRaw = await redis.hgetall('banned') || {};
    const now = Date.now();
    const bannedPlayers = [];
    for (const [name, v] of Object.entries(bannedRaw)) {
      const b = parseVal(v);
      if (!b.until || b.until > now) {
        bannedPlayers.push({ name, ...b, ttl: b.until ? Math.round((b.until - now) / 1000) : 86400 });
      } else {
        await redis.hdel('banned', name);
      }
    }
    return res.json({ ok: true, scores, suspicious, bannedPlayers, blockedIPs: [] });
  }

  if (action === 'deletePlayer') {
    await redis.hdel('scores', extra.playerName);
    return res.json({ ok: true });
  }

  if (action === 'banPlayer') {
    const { playerName, banReason } = extra;
    await redis.hdel('scores', playerName);
    await redis.hset('banned', { [playerName.toLowerCase()]: JSON.stringify({
      reason: banReason || 'Trampa detectada', at: new Date().toISOString(), until: Date.now() + 86400000
    })});
    return res.json({ ok: true });
  }

  if (action === 'unbanPlayer') {
    await redis.hdel('banned', extra.playerName);
    await redis.hdel('banned', extra.playerName.toLowerCase());
    return res.json({ ok: true });
  }

  if (action === 'deleteSuspicious') {
    const target = JSON.parse(extra.suspiciousRaw);
    const all = await redis.lrange('suspicious', 0, -1) || [];
    await redis.del('suspicious');
    for (const item of all) {
      const s = parseVal(item);
      if (!(s.name === target.name && s.at === target.at))
        await redis.lpush('suspicious', JSON.stringify(s));
    }
    return res.json({ ok: true });
  }

  if (action === 'addSuspicious') {
    await redis.lpush('suspicious', JSON.stringify({
      ...extra.suspiciousEntry, manual: true, at: new Date().toISOString()
    }));
    return res.json({ ok: true });
  }

  return res.json({ ok: false, error: 'Acción no reconocida' });
};
