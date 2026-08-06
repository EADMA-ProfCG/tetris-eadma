const { redis, parseVal } = require('./_redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  try {
    const raw = await redis('LRANGE', 'tournaments', 0, 19) || [];
    return res.json({ ok: true, tournaments: raw.map(parseVal) });
  } catch(e) {
    return res.json({ ok: true, tournaments: [] });
  }
};
