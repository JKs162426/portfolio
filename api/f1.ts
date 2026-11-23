// Proxy hacia Jolpica-F1 (sucesora de la API Ergast), pública y sin key.
// Se usa como función serverless de Vercel (export default) y desde el
// servidor de desarrollo de Vite (vite.config.js importa handleF1Request).
//
// Aunque no haya key que esconder, el proxy sirve para:
// - limitar qué se consulta (lista blanca de rutas y temporadas),
// - cachear en la CDN de Vercel: todos los visitantes comparten respuesta y
//   la API (≈4 peticiones/s y 500/hora) recibe muy pocas llamadas,
// - mantener connect-src 'self' en la CSP.
//
// Archivo autocontenido a propósito: Vercel compila cada función por separado
// y un import relativo sin extensión fallaría en ESM. Las constantes de
// temporadas están duplicadas en src/pages/lab/f1/lib/seasons.ts (un test
// comprueba que coinciden).
import type { IncomingMessage, ServerResponse } from "node:http";

const API_BASE = "https://api.jolpi.ca/ergast/f1";
export const MIN_SEASON = 1950;
const UPSTREAM_TIMEOUT_MS = 8000;

const DRIVER_ID = "[a-z][a-z0-9_]{1,40}";
const ROUND = "[1-9]\\d?";

// Las rutas empiezan siempre por la temporada (4 cifras); se valida aparte
const ALLOWED_PATHS = [
  /^\d{4}\/(races|driverstandings|constructorstandings)$/,
  // Ganador de cada carrera de la temporada en una sola petición
  /^\d{4}\/results\/1$/,
  new RegExp(`^\\d{4}\\/${ROUND}\\/(results|qualifying|sprint)$`),
  new RegExp(`^\\d{4}\\/drivers\\/${DRIVER_ID}\\/results$`),
];

// Una temporada terminada ya no cambia: se cachea un día. La actual, 10 min
// (los resultados llegan poco después de cada sesión).
const CACHE_PAST = "public, s-maxage=86400, stale-while-revalidate=604800";
const CACHE_CURRENT = "public, s-maxage=600, stale-while-revalidate=3600";

export function currentSeason(now = new Date()): number {
  return now.getUTCFullYear();
}

export function isAllowedPath(path: string, now = new Date()): boolean {
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) return false;
  const season = Number(path.slice(0, 4));
  return season >= MIN_SEASON && season <= currentSeason(now);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export async function handleF1Request(
  req: IncomingMessage,
  res: ServerResponse,
  now = new Date()
): Promise<void> {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  // Exactamente un parámetro, "path": la CDN usa la URL completa como clave de
  // caché y cualquier extra crearía entradas nuevas que llegan a la API
  const params = [...url.searchParams];
  const [first] = params;
  if (params.length !== 1 || !first || first[0] !== "path") {
    return sendJson(res, 400, { error: "invalid_query" });
  }

  const path = first[1];
  if (!isAllowedPath(path, now)) {
    return sendJson(res, 400, { error: "invalid_path" });
  }

  let response: Response;
  try {
    // limit=100: ninguna ruta permitida devuelve más filas (24 carreras, ~22 pilotos)
    response = await fetch(`${API_BASE}/${path}.json?limit=100`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return sendJson(res, 504, { error: "upstream_timeout" });
    }
    return sendJson(res, 502, { error: "upstream_unreachable" });
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) res.setHeader("Retry-After", retryAfter);
    return sendJson(res, 429, { error: "rate_limited" });
  }
  if (!response.ok) {
    return sendJson(res, response.status >= 500 ? 502 : response.status, { error: "upstream_error" });
  }

  const body = await response.text();
  const season = Number(path.slice(0, 4));
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", season < currentSeason(now) ? CACHE_PAST : CACHE_CURRENT);
  res.end(body);
}

// Función serverless de Vercel: GET /api/f1?path=2026/driverstandings
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleF1Request(req, res);
}
