const { redis, hgetallToObj, parseVal } = require('./_redis');
const { randomUUID } = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { name, category } = req.body || {};
    if (!name || !category) return res.json({ ok: false, error: 'Datos incompletos' });

    const banRaw = await redis('HGET', 'banned', name.toLowerCase());
    if (banRaw) {
      const ban = parseVal(banRaw);
      if (!ban.until || ban.until > Date.now()) {
        const horas = ban.until ? Math.max(1, Math.ceil((ban.until - Date.now()) / 3600000)) : 24;
        return res.json({ ok: false, banned: true, error: `Acceso bloqueado (~${horas}h). Motivo: ${ban.reason || 'trampa detectada'}.` });
      }
      await redis('HDEL', 'banned', name.toLowerCase());
    }

    const token   = randomUUID();
    const session = { name, category, score: 0, lines: 0, level: 1, startedAt: Date.now() };
    await redis('SET', `session:${token}`, JSON.stringify(session), 'EX', 7200);
    return res.json({ ok: true, token });
  } catch(e) {
    console.error('session error:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
};
