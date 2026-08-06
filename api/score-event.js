const { redis, parseVal } = require('./_redis');
const PTS = [0, 100, 300, 500, 800];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const { sessionToken, lines, level } = req.body || {};
    if (!sessionToken) return res.json({ ok: false });

    const raw = await redis('GET', `session:${sessionToken}`);
    if (!raw) return res.json({ ok: false });

    const session   = parseVal(raw);
    const pts       = (PTS[Math.min(lines, 4)] || 800) * (level || 1);
    session.score  += pts;
    session.lines   = (session.lines || 0) + (lines || 0);
    session.level   = level || session.level;

    await redis('SET', `session:${sessionToken}`, JSON.stringify(session), 'EX', 7200);
    return res.json({ ok: true });
  } catch(e) {
    return res.json({ ok: false });
  }
};
