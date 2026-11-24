// Respuestas de la API → forma estable para la app. Toleran campos que faltan:
// las temporadas antiguas no traen horarios, códigos de piloto ni dorsales.
import type {
  ConstructorStanding,
  Driver,
  DriverRace,
  DriverSeason,
  DriverStanding,
  Finish,
  QualifyingResult,
  Race,
  RaceResult,
  RawConstructor,
  RawDriver,
  RawRace,
  RawResponse,
  RawResult,
  RawSession,
  Session,
  SessionKind,
  Standings,
  Team,
  Winners,
} from "./types";

function toNumber(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function races(raw: unknown): RawRace[] {
  return (raw as RawResponse)?.MRData?.RaceTable?.Races ?? [];
}

function toStart(session: RawSession): { start: string; hasTime: boolean } {
  return session.time
    ? { start: `${session.date}T${session.time}`, hasTime: true }
    : { start: session.date, hasTime: false };
}

export function normalizeDriver(d: RawDriver): Driver {
  return {
    id: d.driverId,
    code: d.code ?? null,
    number: d.permanentNumber ?? null,
    name: `${d.givenName} ${d.familyName}`,
    familyName: d.familyName,
    nationality: d.nationality ?? null,
  };
}

export function normalizeTeam(c: RawConstructor): Team {
  return { id: c.constructorId, name: c.name, nationality: c.nationality ?? null };
}

export function normalizeFinish(positionText: string): Finish {
  return /^\d+$/.test(positionText)
    ? { classified: true, position: Number(positionText) }
    : { classified: false, code: positionText || "?" };
}

const SESSION_FIELDS: [keyof RawRace, SessionKind][] = [
  ["FirstPractice", "fp1"],
  ["SecondPractice", "fp2"],
  ["ThirdPractice", "fp3"],
  ["SprintQualifying", "sprintQualifying"],
  ["Sprint", "sprint"],
  ["Qualifying", "qualifying"],
];

export function normalizeSchedule(raw: unknown): Race[] {
  return races(raw).map((race) => {
    const sessions: Session[] = [];
    for (const [field, kind] of SESSION_FIELDS) {
      const session = race[field] as RawSession | undefined;
      if (session?.date) sessions.push({ kind, ...toStart(session) });
    }
    const start = toStart({ date: race.date, time: race.time });
    sessions.push({ kind: "race", ...start });
    sessions.sort((a, b) => a.start.localeCompare(b.start));

    return {
      season: Number(race.season),
      round: Number(race.round),
      name: race.raceName,
      circuit: race.Circuit.circuitName,
      locality: race.Circuit.Location.locality,
      country: race.Circuit.Location.country,
      ...start,
      hasSprint: Boolean(race.Sprint),
      sessions,
    };
  });
}

export function normalizeWinners(raw: unknown): Winners {
  const winners: Winners = {};
  for (const race of races(raw)) {
    const first = race.Results?.[0];
    if (first) {
      winners[Number(race.round)] = {
        driver: normalizeDriver(first.Driver),
        team: normalizeTeam(first.Constructor),
      };
    }
  }
  return winners;
}

function standingsList(raw: unknown) {
  return (raw as RawResponse)?.MRData?.StandingsTable?.StandingsLists?.[0];
}

export function normalizeDriverStandings(raw: unknown): Standings<DriverStanding> {
  const list = standingsList(raw);
  return {
    round: toNumber(list?.round),
    entries: (list?.DriverStandings ?? []).map((s) => ({
      position: toNumber(s.position),
      points: toNumber(s.points) ?? 0,
      wins: toNumber(s.wins) ?? 0,
      driver: normalizeDriver(s.Driver),
      teams: s.Constructors.map(normalizeTeam),
    })),
  };
}

export function normalizeConstructorStandings(raw: unknown): Standings<ConstructorStanding> {
  const list = standingsList(raw);
  return {
    round: toNumber(list?.round),
    entries: (list?.ConstructorStandings ?? []).map((s) => ({
      position: toNumber(s.position),
      points: toNumber(s.points) ?? 0,
      wins: toNumber(s.wins) ?? 0,
      team: normalizeTeam(s.Constructor),
    })),
  };
}

// Doblado: "Lapped" en temporadas recientes, "+1 Lap", "+2 Laps"… en las antiguas
const LAPPED = /^(Lapped|\+\d+ Laps?)$/;

function normalizeResult(r: RawResult, leaderLaps: number | null): RaceResult {
  const laps = toNumber(r.laps);
  const lapped = LAPPED.test(r.status ?? "") && laps !== null && leaderLaps !== null && leaderLaps > laps;
  return {
    finish: normalizeFinish(r.positionText),
    driver: normalizeDriver(r.Driver),
    team: normalizeTeam(r.Constructor),
    grid: toNumber(r.grid),
    laps,
    // Con vueltas perdidas la API manda un tiempo que no es la diferencia con el ganador
    time: lapped ? null : (r.Time?.time ?? null),
    lapsDown: lapped ? leaderLaps - laps : null,
    status: r.status ?? null,
    points: toNumber(r.points) ?? 0,
    fastestLap: r.FastestLap?.rank === "1",
  };
}

/** Resultados de carrera (results) o de sprint (sprint): misma forma */
export function normalizeRaceResults(raw: unknown): RaceResult[] {
  const race = races(raw)[0];
  const rows = race?.Results ?? race?.SprintResults ?? [];
  const leaderLaps = toNumber(rows[0]?.laps);
  return rows.map((r) => normalizeResult(r, leaderLaps));
}

export function normalizeQualifying(raw: unknown): QualifyingResult[] {
  return (races(raw)[0]?.QualifyingResults ?? []).map((q) => ({
    position: Number(q.position),
    driver: normalizeDriver(q.Driver),
    team: normalizeTeam(q.Constructor),
    q1: q.Q1 || null,
    q2: q.Q2 || null,
    q3: q.Q3 || null,
  }));
}

export function normalizeDriverSeason(raw: unknown): DriverSeason {
  let driver: Driver | null = null;
  const list: DriverRace[] = [];
  for (const race of races(raw)) {
    const result = race.Results?.[0];
    if (!result) continue;
    driver ??= normalizeDriver(result.Driver);
    list.push({
      round: Number(race.round),
      name: race.raceName,
      team: normalizeTeam(result.Constructor),
      grid: toNumber(result.grid),
      finish: normalizeFinish(result.positionText),
      points: toNumber(result.points) ?? 0,
    });
  }
  return { driver, races: list };
}
