// Lógica pura sobre los datos normalizados (sin React ni red)
import type { DriverRace, DriverStanding, Race, Winners } from "./types";

export type RaceStatus = "done" | "next" | "upcoming" | "pending";

// Margen tras la salida antes de considerar que una carrera "ya pasó"
const RACE_DURATION_MS = 3 * 60 * 60 * 1000;

function startTime(race: Race): number {
  // Sin hora (temporadas antiguas): se toma el final del día
  return Date.parse(race.hasTime ? race.start : `${race.start}T23:59:59Z`);
}

/**
 * done: hay ganador · pending: ya se corrió pero aún no hay resultados ·
 * next: la próxima por disputar · upcoming: el resto
 */
export function raceStatuses(schedule: Race[], winners: Winners, now = Date.now()): Map<number, RaceStatus> {
  const statuses = new Map<number, RaceStatus>();
  let nextAssigned = false;
  for (const race of schedule) {
    if (winners[race.round]) statuses.set(race.round, "done");
    else if (startTime(race) + RACE_DURATION_MS < now) statuses.set(race.round, "pending");
    else if (!nextAssigned) {
      statuses.set(race.round, "next");
      nextAssigned = true;
    } else statuses.set(race.round, "upcoming");
  }
  return statuses;
}

export function nextRace(schedule: Race[], winners: Winners, now = Date.now()): Race | null {
  const statuses = raceStatuses(schedule, winners, now);
  return schedule.find((race) => statuses.get(race.round) === "next") ?? null;
}

/** Días enteros desde `now` hasta `iso` (0 = hoy o ya empezó) */
export function daysUntil(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now) / (24 * 60 * 60 * 1000)));
}

export interface DriverSummary {
  starts: number;
  wins: number;
  podiums: number;
  best: number | null;
  dnfs: number;
  points: number;
}

export function summarizeDriver(races: DriverRace[]): DriverSummary {
  const summary: DriverSummary = { starts: 0, wins: 0, podiums: 0, best: null, dnfs: 0, points: 0 };
  for (const race of races) {
    summary.points += race.points;
    // W = no tomó la salida: no cuenta como carrera disputada
    if (!race.finish.classified && race.finish.code === "W") continue;
    summary.starts++;
    if (!race.finish.classified) {
      summary.dnfs++;
      continue;
    }
    const { position } = race.finish;
    if (position === 1) summary.wins++;
    if (position <= 3) summary.podiums++;
    if (summary.best === null || position < summary.best) summary.best = position;
  }
  return summary;
}

/** Pilotos que puntuaron para un equipo, según la clasificación de pilotos */
export function driversOfTeam(standings: DriverStanding[], teamId: string): DriverStanding[] {
  return standings.filter((s) => s.teams.some((team) => team.id === teamId));
}

/** Diferencia con el líder: null para el líder */
export function gapToLeader(points: number, leaderPoints: number | undefined): number | null {
  if (leaderPoints === undefined || points >= leaderPoints) return null;
  return leaderPoints - points;
}

/** Posiciones ganadas (+) o perdidas (−) respecto a la salida */
export function positionsGained(grid: number | null, position: number): number | null {
  // grid 0 = salió desde el pit lane: no hay posición de salida con la que comparar
  if (grid === null || grid === 0) return null;
  return grid - position;
}
