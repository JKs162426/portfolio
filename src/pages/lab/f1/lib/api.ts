import { readStorage, writeStorage } from "../../../../hooks/useLocalStorage";
import {
  normalizeConstructorStandings,
  normalizeDriverSeason,
  normalizeDriverStandings,
  normalizeQualifying,
  normalizeRaceResults,
  normalizeSchedule,
  normalizeWinners,
} from "./normalize";
import { createRateLimiter, type RateLimiter } from "./rateLimit";
import { isPastSeason } from "./seasons";
import type {
  ConstructorStanding,
  DriverSeason,
  DriverStanding,
  QualifyingResult,
  Race,
  RaceResult,
  Standings,
  Winners,
} from "./types";

const ENDPOINT = "/api/f1";
const CACHE_PREFIX = "f1:v1:";
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Máximo de peticiones reales (las que salen de la caché no cuentan) por pestaña.
// Entrar en la app gasta 2 y cada carrera o piloto abierto 1: 20 por minuto
// alcanza de sobra para navegar, y protege el cupo de 500/hora de la API.
export const RATE_LIMIT = { limit: 20, windowMs: MINUTE };

export interface Resource<T> {
  path: string;
  /** Tiempo que la copia local sigue siendo válida */
  ttl: (data: T) => number;
  normalize: (raw: unknown) => T;
}

export type ErrorKind = "network" | "rate_limit" | "not_found" | "server";

export class F1ApiError extends Error {
  readonly kind: ErrorKind;
  /** Segundos hasta poder reintentar (solo rate_limit) */
  readonly retryAfter: number | null;

  constructor(kind: ErrorKind, retryAfter: number | null = null) {
    super(kind);
    this.name = "F1ApiError";
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

// ---------- Recursos ----------
// Se memorizan por ruta: el hook necesita el mismo objeto en cada render.

const memo = new Map<string, Resource<unknown>>();

function resource<T>(
  path: string,
  season: number,
  ttlCurrent: number,
  normalize: (raw: unknown) => T
): Resource<T> {
  if (!memo.has(path)) {
    // Una temporada terminada no cambia: un día de caché local
    const ttl = isPastSeason(season) ? DAY : ttlCurrent;
    memo.set(path, { path, ttl: () => ttl, normalize } as Resource<unknown>);
  }
  return memo.get(path) as Resource<T>;
}

export const resources = {
  schedule: (season: number): Resource<Race[]> =>
    resource(`${season}/races`, season, 6 * HOUR, normalizeSchedule),
  winners: (season: number): Resource<Winners> =>
    resource(`${season}/results/1`, season, 10 * MINUTE, normalizeWinners),
  driverStandings: (season: number): Resource<Standings<DriverStanding>> =>
    resource(`${season}/driverstandings`, season, 10 * MINUTE, normalizeDriverStandings),
  constructorStandings: (season: number): Resource<Standings<ConstructorStanding>> =>
    resource(`${season}/constructorstandings`, season, 10 * MINUTE, normalizeConstructorStandings),
  raceResults: (season: number, round: number): Resource<RaceResult[]> =>
    resource(`${season}/${round}/results`, season, 10 * MINUTE, normalizeRaceResults),
  sprintResults: (season: number, round: number): Resource<RaceResult[]> =>
    resource(`${season}/${round}/sprint`, season, 10 * MINUTE, normalizeRaceResults),
  qualifying: (season: number, round: number): Resource<QualifyingResult[]> =>
    resource(`${season}/${round}/qualifying`, season, 10 * MINUTE, normalizeQualifying),
  driverSeason: (season: number, driverId: string): Resource<DriverSeason> =>
    resource(`${season}/drivers/${driverId}/results`, season, 10 * MINUTE, normalizeDriverSeason),
};

// ---------- Peticiones ----------

let limiter: RateLimiter = createRateLimiter(RATE_LIMIT);
const inflight = new Map<string, Promise<Loaded<unknown>>>();

/** Solo para tests: vacía el límite y las peticiones en curso */
export function resetClient(): void {
  limiter = createRateLimiter(RATE_LIMIT);
  inflight.clear();
}

async function request(path: string): Promise<unknown> {
  const wait = limiter.take();
  if (wait > 0) throw new F1ApiError("rate_limit", Math.ceil(wait / 1000));

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?path=${encodeURIComponent(path)}`);
  } catch {
    throw new F1ApiError("network");
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new F1ApiError("rate_limit", retryAfter > 0 ? retryAfter : 60);
  }
  // El proxy responde 404 si la ronda o el piloto no existen en esa temporada
  if (response.status === 404) throw new F1ApiError("not_found");
  if (!response.ok) throw new F1ApiError("server");

  try {
    return await response.json();
  } catch {
    // Respuesta que no es JSON (p. ej. el proxy no está montado)
    throw new F1ApiError("server");
  }
}

export interface Loaded<T> {
  data: T;
  fetchedAt: number;
  /** true: la petición falló y se muestran datos guardados */
  stale: boolean;
  error?: F1ApiError;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

function isCacheEntry<T>(value: unknown): value is CacheEntry<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { fetchedAt?: unknown }).fetchedAt === "number"
  );
}

/**
 * - Si la copia local es reciente, no hay petición.
 * - Peticiones simultáneas al mismo recurso se comparten.
 * - Si la petición falla (o se alcanzó el límite) y hay copia vieja, se
 *   devuelve con stale: true en vez de un error.
 */
export function fetchResource<T>(
  res: Resource<T>,
  { force = false }: { force?: boolean } = {}
): Promise<Loaded<T>> {
  const key = CACHE_PREFIX + res.path;
  const stored: unknown = readStorage(key, null);
  const cached = isCacheEntry<T>(stored) ? stored : null;

  if (!force && cached && Date.now() - cached.fetchedAt < res.ttl(cached.data)) {
    return Promise.resolve({ data: cached.data, fetchedAt: cached.fetchedAt, stale: false });
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<Loaded<T>>;

  const promise = request(res.path)
    .then((raw): Loaded<T> => {
      const entry: CacheEntry<T> = { data: res.normalize(raw), fetchedAt: Date.now() };
      writeStorage(key, entry);
      return { ...entry, stale: false };
    })
    .catch((error: unknown): Loaded<T> => {
      const apiError = error instanceof F1ApiError ? error : new F1ApiError("server");
      // Un "no existe" no se tapa con datos viejos
      if (cached && apiError.kind !== "not_found") return { ...cached, stale: true, error: apiError };
      throw apiError;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
