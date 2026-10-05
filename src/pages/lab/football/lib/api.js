import { readStorage, writeStorage } from "../../../../hooks/useLocalStorage";
import { normalizeMatches, normalizeStandings, normalizeMatchDetail } from "./normalize";
import { statusGroup } from "./utils";

const ENDPOINT = "/api/football";
const CACHE_PREFIX = "football:v1:";
const MINUTE = 60 * 1000;

// Recursos de una liga. El TTL puede depender de los datos: si hay
// partidos en vivo, la caché caduca antes. Se memorizan por código para
// que cada liga tenga siempre el mismo objeto (useFootballData lo necesita).
const leagueResources = new Map();

export function getLeagueResources(code) {
  if (!leagueResources.has(code)) {
    leagueResources.set(code, {
      standings: {
        path: `competitions/${code}/standings`,
        ttl: () => 10 * MINUTE,
        normalize: normalizeStandings,
      },
      matches: {
        path: `competitions/${code}/matches`,
        ttl: (matches) =>
          matches.some((m) => statusGroup(m.status) === "live") ? MINUTE : 5 * MINUTE,
        normalize: normalizeMatches,
      },
    });
  }
  return leagueResources.get(code);
}

export function matchResource(id) {
  return {
    path: `matches/${id}`,
    ttl: (match) => (statusGroup(match.status) === "live" ? MINUTE : 30 * MINUTE),
    normalize: normalizeMatchDetail,
  };
}

export class FootballApiError extends Error {
  constructor(kind, { retryAfter = null } = {}) {
    super(kind);
    this.kind = kind; // network | rate_limit | config | auth | not_found | server
    this.retryAfter = retryAfter;
  }
}

async function request(path) {
  let response;
  try {
    response = await fetch(`${ENDPOINT}?path=${encodeURIComponent(path)}`);
  } catch {
    throw new FootballApiError("network");
  }

  if (response.status === 429) {
    const reset = Number(response.headers.get("x-requestcounter-reset"));
    throw new FootballApiError("rate_limit", { retryAfter: reset || 60 });
  }

  let body;
  try {
    body = await response.json();
  } catch {
    // Respuesta que no es JSON (p. ej. el proxy no está montado)
    throw new FootballApiError("server");
  }

  if (!response.ok) {
    if (body?.error === "missing_key") throw new FootballApiError("config");
    if (response.status === 400 || response.status === 403) throw new FootballApiError("auth");
    if (response.status === 404) throw new FootballApiError("not_found");
    throw new FootballApiError("server");
  }
  return body;
}

// Evita pedir dos veces lo mismo a la vez (StrictMode, varias vistas…)
const inflight = new Map();

/**
 * Devuelve { data, fetchedAt, stale }.
 * - Si la caché local es reciente, no hace petición.
 * - Si la petición falla pero hay caché vieja, la devuelve con stale: true.
 */
export function fetchResource(resource, { force = false } = {}) {
  const key = CACHE_PREFIX + resource.path;
  const cached = readStorage(key, null);
  const hasCache = cached && cached.fetchedAt && cached.data !== undefined;

  if (!force && hasCache && Date.now() - cached.fetchedAt < resource.ttl(cached.data)) {
    return Promise.resolve({ data: cached.data, fetchedAt: cached.fetchedAt, stale: false });
  }

  if (inflight.has(key)) return inflight.get(key);

  const promise = request(resource.path)
    .then((raw) => {
      const entry = { data: resource.normalize(raw), fetchedAt: Date.now() };
      writeStorage(key, entry);
      return { ...entry, stale: false };
    })
    .catch((error) => {
      if (hasCache && error.kind !== "not_found") {
        return { data: cached.data, fetchedAt: cached.fetchedAt, stale: true, error };
      }
      throw error;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
