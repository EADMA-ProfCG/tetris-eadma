const { kv } = require('@vercel/kv');
const PTS = [0, 100, 300, 500, 800];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── GET: devuelve todos los puntajes ──────────────────────────
  if (req.method === 'GET') {
    const raw = await kv.hgetall('scores') || {};
    const scores = {};
    for (const [k, v] of Object.entries(raw)) {
      try { scores[k] = typeof v === 'string' ? JSON.parse(v) : v; } catch(e) { scores[k] = v; }
    }
    return res.json({ ok: true, scores });
  }

  // ── POST: guarda puntaje al terminar partida ───────────────────
  if (req.method === 'POST') {
    const { name, sessionToken } = req.body || {};
    if (!name || !sessionToken) return res.json({ ok: false, error: 'Datos incompletos' });

    const rawSession = await kv.get(`session:${sessionToken}`);
    if (!rawSession) return res.json({ ok: false, error: 'Sesión inválida o expirada' });

    const session = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession;
    if (session.name.toLowerCase() !== name.toLowerCase())
      return res.json({ ok: false, error: 'El nombre no coincide con la sesión' });

    const duration = Date.now() - session.startedAt;
    const finalScore = session.score;

    const prevRaw = await kv.hget('scores', name);
    const prev = prevRaw ? (typeof prevRaw === 'string' ? JSON.parse(prevRaw) : prevRaw) : null;
    const prevScore = prev?.score ?? (typeof prev === 'number' ? prev : 0);

    let updated = false;
    if (finalScore > prevScore) {
      const entry = {
        score: finalScore, lines: session.lines || 0, level: session.level || 1,
        category: session.category, duration, at: new Date().toISOString()
      };
      await kv.hset('scores', { [name]: JSON.stringify(entry) });
      updated = true;

      // Auto-detectar jugadores sospechosos (>200 pts/seg)
      const pps = finalScore / (duration / 1000);
      if (pps > 200 && duration > 5000) {
        const suspEntry = {
          name, score: finalScore, lines: session.lines, level: session.level,
          duration, reason: `Puntaje por segundo elevado: ${pps.toFixed(1)} pts/s`,
          at: entry.at
        };
        await kv.lpush('suspicious', JSON.stringify(suspEntry));
      }
    }

    await kv.del(`session:${sessionToken}`);
    return res.json({ ok: true, updated, score: finalScore, best: Math.max(prevScore, finalScore) });
  }

  return res.status(405).json({ ok: false, error: 'Método no permitido' });
};
