// Helper compartido: ejecuta cualquier comando Redis via Upstash HTTP REST API
// No requiere npm ni instalación — usa fetch() nativo de Node.js 18+

async function redis(...args) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Faltan las variables UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN');
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(args)
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

// Convierte el array plano ['k1','v1','k2','v2'] que devuelve HGETALL en un objeto
function hgetallToObj(arr) {
  if (!arr || !Array.isArray(arr)) return {};
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i + 1];
  return obj;
}

function parseVal(v) {
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch(e) { return v; }
}

module.exports = { redis, hgetallToObj, parseVal };
