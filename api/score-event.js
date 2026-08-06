const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const PTS = [0, 100, 300, 500, 800];
function parseVal(v){try{return typeof v==='string'?JSON.parse(v):v;}catch(e){return v;}}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { sessionToken, lines, level } = req.body || {};
  if (!sessionToken) return res.json({ ok: false });

  const raw = await redis.get(`session:${sessionToken}`);
  if (!raw) return res.json({ ok: false });

  const session = parseVal(raw);
  const pts = (PTS[Math.min(lines, 4)] || 800) * (level || 1);
  session.score += pts;
  session.lines  = (session.lines || 0) + (lines || 0);
  session.level  = level || session.level;

  await redis.set(`session:${sessionToken}`, JSON.stringify(session), { ex: 7200 });
  return res.json({ ok: true });
};
