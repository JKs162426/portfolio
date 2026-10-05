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
  /^matches\/\d+$/,
];
const ALLOWED_QUERY = ["season", "matchday", "status", "dateFrom", "dateTo"];

// Cabeceras de rate limit que el cliente usa para avisar al usuario
const FORWARDED_HEADERS = [
  "x-requests-available-minute",
  "x-requestcounter-reset",
];

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
  const path = url.searchParams.get("path") ?? "";

  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
    return sendJson(res, 400, { error: "invalid_path" });
  }
  if (!apiKey) {
    return sendJson(res, 500, { error: "missing_key" });
  }

  const upstream = new URL(`${API_BASE}/${path}`);
  for (const name of ALLOWED_QUERY) {
    const value = url.searchParams.get(name);
    if (value) upstream.searchParams.set(name, value);
  }

  let response;
  try {
    response = await fetch(upstream, { headers: { "X-Auth-Token": apiKey } });
  } catch {
    return sendJson(res, 502, { error: "upstream_unreachable" });
  }

  const body = await response.text();
  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const name of FORWARDED_HEADERS) {
    const value = response.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  if (response.ok) {
    // La CDN de Vercel comparte la respuesta entre visitantes: menos peticiones
    // contra el límite de 10/min del plan gratuito
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  }
  res.end(body);
}
