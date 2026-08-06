const { redis, hgetallToObj, parseVal } = require('./_redis');
const PTS = [0, 100, 300, 500, 800];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // GET — devuelve todos los puntajes
    if (req.method === 'GET') {
      const raw = hgetallToObj(await redis('HGETALL', 'scores'));
      const scores = {};
      for (const [k, v] of Object.entries(raw)) scores[k] = parseVal(v);
      return res.json({ ok: true, scores });
    }

    // POST — guarda puntaje al terminar partida
    if (req.method === 'POST') {
      const { name, sessionToken } = req.body || {};
      if (!name || !sessionToken) return res.json({ ok: false, error: 'Datos incompletos' });

      const rawSession = await redis('GET', `session:${sessionToken}`);
      if (!rawSession) return res.json({ ok: false, error: 'Sesión inválida o expirada' });

      const session  = parseVal(rawSession);
      if (session.name.toLowerCase() !== name.toLowerCase())
        return res.json({ ok: false, error: 'El nombre no coincide con la sesión' });

      const duration   = Date.now() - session.startedAt;
      const finalScore = session.score;
      const prevRaw    = await redis('HGET', 'scores', name);
      const prev       = parseVal(prevRaw);
      const prevScore  = prev?.score ?? (typeof prev === 'number' ? prev : 0);

      let updated = false;
      if (finalScore > prevScore) {
        const entry = { score: finalScore, lines: session.lines || 0, level: session.level || 1,
          category: session.category, duration, at: new Date().toISOString() };
        await redis('HSET', 'scores', name, JSON.stringify(entry));
        updated = true;
        const pps = finalScore / (duration / 1000);
        if (pps > 200 && duration > 5000) {
          await redis('LPUSH', 'suspicious', JSON.stringify({
            name, score: finalScore, lines: session.lines, level: session.level,
            duration, reason: `${pps.toFixed(1)} pts/s`, at: entry.at
          }));
        }
      }
      await redis('DEL', `session:${sessionToken}`);
      return res.json({ ok: true, updated, score: finalScore, best: Math.max(prevScore, finalScore) });
    }

    return res.status(405).json({ ok: false });
  } catch(e) {
    console.error('scores error:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
};
