// Proxy hacia football-data.org.
// Se usa desde la función de Vercel (api/football.js) y desde el servidor de
// desarrollo de Vite (vite.config.js), así la API key nunca llega al navegador.
// Solo usa APIs nativas de Node (req/res) para funcionar en ambos entornos.

const API_BASE = "https://api.football-data.org/v4";

// Lista blanca: el proxy no debe servir para consultar cualquier endpoint.
// Ligas: mantener en sincronía con src/pages/lab/football/lib/leagues.js
const LEAGUE_CODES = ["PL", "PD", "SA", "BL1", "FL1", "CL", "CLI"];
const ALLOWED_PATHS = [
  new RegExp(`^competitions/(${LEAGUE_CODES.join("|")})/(standings|matches)$`),
  // Sin ceros a la izquierda: matches/0007 sería otra entrada de caché para el mismo partido
  /^matches\/[1-9]\d{0,9}$/,
];

// Si la API no responde en este tiempo se corta, en vez de dejar la función
// colgada hasta el límite de Vercel
const UPSTREAM_TIMEOUT_MS = 8000;

// Cabeceras de rate limit que el cliente usa para avisar al usuario
const FORWARDED_HEADERS = [
  "x-requests-available-minute",
  "x-requestcounter-reset",
];

// Caché de la CDN de Vercel, compartida entre visitantes: menos peticiones
// contra el límite de 10/min del plan gratuito
const CACHE_OK = "public, s-maxage=60, stale-while-revalidate=300";
// Los 404 (partido inexistente) también se cachean para que repetirlos no gaste cuota
const CACHE_NOT_FOUND = "public, s-maxage=3600";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export async function handleFootballRequest(req, res, apiKey) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const url = new URL(req.url, "http://localhost");

  // Exactamente un parámetro, "path". La CDN usa la URL completa como clave de
  // caché: cualquier extra (?x=1, un segundo path…) crearía una entrada nueva y
  // permitiría agotar la cuota de la API con un simple bucle.
  const params = [...url.searchParams];
  if (params.length !== 1 || params[0][0] !== "path") {
    return sendJson(res, 400, { error: "invalid_query" });
  }

  const path = params[0][1];
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    return sendJson(res, 400, { error: "invalid_path" });
  }
  if (!apiKey) {
    return sendJson(res, 500, { error: "missing_key" });
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/${path}`, {
      headers: { "X-Auth-Token": apiKey },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === "TimeoutError") {
      return sendJson(res, 504, { error: "upstream_timeout" });
    }
    return sendJson(res, 502, { error: "upstream_unreachable" });
  }

  const body = await response.text();
  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const name of FORWARDED_HEADERS) {
    const value = response.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  if (response.ok) res.setHeader("Cache-Control", CACHE_OK);
  else if (response.status === 404) res.setHeader("Cache-Control", CACHE_NOT_FOUND);
  res.end(body);
}
