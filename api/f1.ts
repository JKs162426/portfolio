// Proxy hacia Jolpica-F1 (sucesora de la API Ergast), pública y sin key.
// Se usa como función serverless de Vercel (export default) y desde el
// servidor de desarrollo de Vite (vite.config.js importa handleF1Request).
//
// La API admite CORS: el navegador podría llamarla directo. El proxy existe para
// que todos los visitantes compartan la caché de la CDN de Vercel y Jolpica
// (≈4 peticiones/s y 500/hora, mantenida por voluntarios) reciba muy pocas
// llamadas. Para que esa caché no se pueda esquivar, el número de URLs válidas
// está acotado (ver README del lab: "¿Por qué un proxy?").
//
// Archivo autocontenido a propósito: Vercel compila cada función por separado
// y un import relativo sin extensión fallaría en ESM. MIN_SEASON está
// duplicado en src/pages/lab/f1/lib/seasons.ts (un test comprueba que coinciden).
import type { IncomingMessage, ServerResponse } from "node:http";

const API_BASE = "https://api.jolpi.ca/ergast/f1";
export const MIN_SEASON = 1950;
const UPSTREAM_TIMEOUT_MS = 8000;
// Máximo por página de la API. Algunas temporadas tienen más pilotos (1952: 105)
const PAGE_SIZE = 100;
const MAX_PAGES = 3;

// Ninguna temporada ha pasado de 24 carreras: 30 deja margen sin abrir la puerta a 99
const ROUND = "([1-9]|[12]\\d|30)";
const DRIVER_ID = "[a-z][a-z0-9_]{1,40}";

// Capa 1: forma de la ruta. Empiezan siempre por la temporada (4 cifras)
const SEASON_PATHS = [
  /^\d{4}\/(races|driverstandings|constructorstandings)$/,
  // Ganador de cada carrera de la temporada en una sola petición
  /^\d{4}\/results\/1$/,
];
const ROUND_PATH = new RegExp(`^\\d{4}\\/${ROUND}\\/(results|qualifying|sprint)$`);
const DRIVER_PATH = new RegExp(`^\\d{4}\\/drivers\\/(${DRIVER_ID})\\/results$`);

// Una temporada terminada ya no cambia: se cachea un día. La actual, 10 min
// (los resultados llegan poco después de cada sesión).
const CACHE_PAST = "public, s-maxage=86400, stale-while-revalidate=604800";
const CACHE_CURRENT = "public, s-maxage=600, stale-while-revalidate=3600";
// Una ronda o un piloto que no existen tampoco van a existir pronto
const CACHE_NOT_FOUND = "public, s-maxage=3600";

const MINUTE = 60 * 1000;

export function currentSeason(now = new Date()): number {
  return now.getUTCFullYear();
}

export type PathMatch =
  | { kind: "season"; season: number }
  | { kind: "round"; season: number; round: number }
  | { kind: "driver"; season: number; driverId: string };

/** Capas 1 y 2: forma de la ruta y temporada entre 1950 y la actual */
export function matchPath(path: string, now = new Date()): PathMatch | null {
  const season = Number(path.slice(0, 4));
  if (!(season >= MIN_SEASON && season <= currentSeason(now))) return null;

  if (SEASON_PATHS.some((pattern) => pattern.test(path))) return { kind: "season", season };
  const round = ROUND_PATH.exec(path);
  if (round) return { kind: "round", season, round: Number(round[1]) };
  const driver = DRIVER_PATH.exec(path);
  if (driver) return { kind: "driver", season, driverId: driver[1]! };
  return null;
}

export function isAllowedPath(path: string, now = new Date()): boolean {
  return matchPath(path, now) !== null;
}

// ---------- Capa 3: índice de cada temporada ----------
// Rondas y pilotos que existen de verdad, guardados en la memoria de la función.
// Así una ronda o un piloto inventados se rechazan sin llamar a la API, y las
// URLs válidas son unas pocas miles en total: casi todo sale de la CDN.

interface SeasonIndex {
  rounds: number;
  drivers: Set<string>;
}

interface IndexEntry {
  promise: Promise<SeasonIndex>;
  expires: number;
}

const seasonIndex = new Map<number, IndexEntry>();

class UpstreamError extends Error {
  readonly status: number;
  readonly retryAfter: string | null;

  constructor(status: number, retryAfter: string | null = null) {
    super(`upstream_${status}`);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// ---------- Capa 4: si la API responde 429, no se le insiste ----------
let blockedUntil = 0;

/** Solo para tests: vacía el índice y el bloqueo por 429 */
export function resetProxyState(): void {
  seasonIndex.clear();
  blockedUntil = 0;
}

async function upstream(path: string, offset = 0, now = new Date()): Promise<Response> {
  if (now.getTime() < blockedUntil) {
    throw new UpstreamError(429, String(Math.ceil((blockedUntil - now.getTime()) / 1000)));
  }
  const query = offset > 0 ? `limit=${PAGE_SIZE}&offset=${offset}` : `limit=${PAGE_SIZE}`;
  const response = await fetch(`${API_BASE}/${path}.json?${query}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after")) || 60;
    blockedUntil = now.getTime() + retryAfter * 1000;
    throw new UpstreamError(429, String(retryAfter));
  }
  return response;
}

interface Page {
  MRData?: {
    total?: string;
    DriverTable?: { Drivers?: { driverId: string }[] };
  };
}

async function readPage(path: string, offset: number, now: Date): Promise<Page> {
  const response = await upstream(path, offset, now);
  if (!response.ok) throw new UpstreamError(response.status >= 500 ? 502 : response.status);
  return (await response.json()) as Page;
}

async function buildIndex(season: number, now: Date): Promise<SeasonIndex> {
  const [races, firstDrivers] = await Promise.all([
    readPage(`${season}/races`, 0, now),
    readPage(`${season}/drivers`, 0, now),
  ]);
  const drivers = new Set((firstDrivers.MRData?.DriverTable?.Drivers ?? []).map((d) => d.driverId));
  const total = Number(firstDrivers.MRData?.total) || 0;
  for (let page = 1; page < MAX_PAGES && page * PAGE_SIZE < total; page++) {
    const next = await readPage(`${season}/drivers`, page * PAGE_SIZE, now);
    for (const d of next.MRData?.DriverTable?.Drivers ?? []) drivers.add(d.driverId);
  }
  return { rounds: Number(races.MRData?.total) || 0, drivers };
}

function getSeasonIndex(season: number, now: Date): Promise<SeasonIndex> {
  const cached = seasonIndex.get(season);
  if (cached && cached.expires > now.getTime()) return cached.promise;

  // Temporada actual: puede debutar un piloto o añadirse una carrera
  const ttl = season < currentSeason(now) ? 24 * 60 * MINUTE : 10 * MINUTE;
  const promise = buildIndex(season, now);
  seasonIndex.set(season, { promise, expires: now.getTime() + ttl });
  // Un fallo no se guarda: la siguiente petición lo vuelve a intentar
  promise.catch(() => {
    if (seasonIndex.get(season)?.promise === promise) seasonIndex.delete(season);
  });
  return promise;
}

/** null si la ronda o el piloto existen; si no, el código de error */
async function checkExists(match: PathMatch, now: Date): Promise<string | null> {
  if (match.kind === "season") return null;
  const index = await getSeasonIndex(match.season, now);
  if (match.kind === "round") return match.round <= index.rounds ? null : "unknown_round";
  return index.drivers.has(match.driverId) ? null : "unknown_driver";
}

// ---------- Respuestas ----------

function sendJson(res: ServerResponse, status: number, body: unknown, cache?: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (cache) res.setHeader("Cache-Control", cache);
  res.end(JSON.stringify(body));
}

function sendUpstreamError(res: ServerResponse, error: unknown): void {
  if (error instanceof UpstreamError) {
    if (error.status === 429) {
      if (error.retryAfter) res.setHeader("Retry-After", error.retryAfter);
      return sendJson(res, 429, { error: "rate_limited" });
    }
    return sendJson(res, error.status >= 500 ? 502 : error.status, { error: "upstream_error" });
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return sendJson(res, 504, { error: "upstream_timeout" });
  }
  return sendJson(res, 502, { error: "upstream_unreachable" });
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
  const match = matchPath(path, now);
  if (!match) {
    return sendJson(res, 400, { error: "invalid_path" });
  }

  try {
    const missing = await checkExists(match, now);
    if (missing) return sendJson(res, 404, { error: missing }, CACHE_NOT_FOUND);

    const response = await upstream(path, 0, now);
    if (!response.ok) throw new UpstreamError(response.status >= 500 ? 502 : response.status);

    const body = await response.text();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", match.season < currentSeason(now) ? CACHE_PAST : CACHE_CURRENT);
    res.end(body);
  } catch (error) {
    sendUpstreamError(res, error);
  }
}

// Función serverless de Vercel: GET /api/f1?path=2026/driverstandings
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleF1Request(req, res);
}
