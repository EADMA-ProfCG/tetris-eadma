const { kv } = require('@vercel/kv');
const { randomUUID } = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { name, category } = req.body || {};
  if (!name || !category) return res.json({ ok: false, error: 'Datos incompletos' });

  // Verificar si el jugador está baneado
  const banRaw = await kv.hget('banned', name.toLowerCase());
  if (banRaw) {
    const ban = typeof banRaw === 'string' ? JSON.parse(banRaw) : banRaw;
    if (!ban.until || ban.until > Date.now()) {
      const horas = ban.until ? Math.max(1, Math.ceil((ban.until - Date.now()) / 3600000)) : 24;
      return res.json({ ok: false, banned: true, error: `Tu acceso está bloqueado temporalmente (~${horas}h). Motivo: ${ban.reason || 'trampa detectada'}.` });
    }
    // Ban expirado: limpiar
    await kv.hdel('banned', name.toLowerCase());
  }

  const token = randomUUID();
  const session = { name, category, score: 0, lines: 0, level: 1, startedAt: Date.now() };
  await kv.set(`session:${token}`, JSON.stringify(session), { ex: 7200 }); // TTL 2h

  return res.json({ ok: true, token });
};
