const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
function parseVal(v){try{return typeof v==='string'?JSON.parse(v):v;}catch(e){return v;}}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const raw = await redis.lrange('tournaments', 0, 19) || [];
  return res.json({ ok: true, tournaments: raw.map(parseVal) });
};
