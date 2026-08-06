const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2026';

function parseVal(v) {
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch(e) { return v; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { password, action, ...extra } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.json({ ok: false, error: 'Contraseña incorrecta' });

  // ── getData ──────────────────────────────────────────────────
  if (action === 'getData') {
    const scoresRaw = await kv.hgetall('scores') || {};
    const scores = {};
    for (const [k, v] of Object.entries(scoresRaw)) scores[k] = parseVal(v);

    const suspRaw = await kv.lrange('suspicious', 0, 49) || [];
    const suspicious = suspRaw.map(parseVal);

    const bannedRaw = await kv.hgetall('banned') || {};
    const now = Date.now();
    const bannedPlayers = [];
    for (const [name, v] of Object.entries(bannedRaw)) {
      const b = parseVal(v);
      if (!b.until || b.until > now) {
        bannedPlayers.push({ name, ...b, ttl: b.until ? Math.round((b.until - now) / 1000) : 86400 });
      } else {
        await kv.hdel('banned', name); // limpiar banes expirados
      }
    }

    return res.json({ ok: true, scores, suspicious, bannedPlayers, blockedIPs: [] });
  }

  // ── deletePlayer ─────────────────────────────────────────────
  if (action === 'deletePlayer') {
    const { playerName } = extra;
    if (!playerName) return res.json({ ok: false, error: 'Falta el nombre del jugador' });
    await kv.hdel('scores', playerName);
    return res.json({ ok: true });
  }

  // ── banPlayer ────────────────────────────────────────────────
  if (action === 'banPlayer') {
    const { playerName, banReason } = extra;
    if (!playerName) return res.json({ ok: false, error: 'Falta el nombre del jugador' });
    await kv.hdel('scores', playerName);
    const banData = {
      reason: banReason || 'Trampa detectada',
      at: new Date().toISOString(),
      until: Date.now() + 86400000 // 24h
    };
    await kv.hset('banned', { [playerName.toLowerCase()]: JSON.stringify(banData) });
    return res.json({ ok: true });
  }

  // ── unbanPlayer ──────────────────────────────────────────────
  if (action === 'unbanPlayer') {
    const { playerName } = extra;
    await kv.hdel('banned', playerName);
    await kv.hdel('banned', playerName.toLowerCase());
    return res.json({ ok: true });
  }

  // ── deleteSuspicious ─────────────────────────────────────────
  if (action === 'deleteSuspicious') {
    const { suspiciousRaw } = extra;
    const target = JSON.parse(suspiciousRaw);
    const all = await kv.lrange('suspicious', 0, -1) || [];
    await kv.del('suspicious');
    for (const item of all) {
      const s = parseVal(item);
      if (!(s.name === target.name && s.at === target.at)) {
        await kv.lpush('suspicious', JSON.stringify(s));
      }
    }
    return res.json({ ok: true });
  }

  // ── addSuspicious ─────────────────────────────────────────────
  if (action === 'addSuspicious') {
    const { suspiciousEntry } = extra;
    await kv.lpush('suspicious', JSON.stringify({
      ...suspiciousEntry, manual: true, at: new Date().toISOString()
    }));
    return res.json({ ok: true });
  }

  return res.json({ ok: false, error: 'Acción no reconocida' });
};
