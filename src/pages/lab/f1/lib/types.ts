// ---------- Respuesta de la API (solo los campos que se usan) ----------
// Jolpica/Ergast devuelve todos los números como string.

export interface RawDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  nationality?: string;
}

export interface RawConstructor {
  constructorId: string;
  name: string;
  nationality?: string;
}

export interface RawSession {
  date: string;
  time?: string;
}

export interface RawRace {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
  FirstPractice?: RawSession;
  SecondPractice?: RawSession;
  ThirdPractice?: RawSession;
  SprintQualifying?: RawSession;
  Sprint?: RawSession;
  Qualifying?: RawSession;
  Results?: RawResult[];
  SprintResults?: RawResult[];
  QualifyingResults?: RawQualifyingResult[];
}

export interface RawResult {
  number?: string;
  position: string;
  positionText: string;
  points: string;
  grid?: string;
  laps?: string;
  status?: string;
  Driver: RawDriver;
  Constructor: RawConstructor;
  Time?: { time: string };
  FastestLap?: { rank?: string; lap?: string; Time?: { time: string } };
}

export interface RawQualifyingResult {
  position: string;
  Driver: RawDriver;
  Constructor: RawConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface RawDriverStanding {
  position?: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: RawDriver;
  Constructors: RawConstructor[];
}

export interface RawConstructorStanding {
  position?: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: RawConstructor;
}

export interface RawResponse {
  MRData?: {
    RaceTable?: { Races?: RawRace[] };
    StandingsTable?: {
      StandingsLists?: {
        round?: string;
        DriverStandings?: RawDriverStanding[];
        ConstructorStandings?: RawConstructorStanding[];
      }[];
    };
  };
}

// ---------- Forma normalizada que usa la app ----------

export type SessionKind = "fp1" | "fp2" | "fp3" | "sprintQualifying" | "sprint" | "qualifying" | "race";

export interface Session {
  kind: SessionKind;
  /** ISO: con hora ("2026-03-08T04:00:00Z") o solo fecha en temporadas antiguas */
  start: string;
  hasTime: boolean;
}

export interface Race {
  season: number;
  round: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  start: string;
  hasTime: boolean;
  hasSprint: boolean;
  sessions: Session[];
}

export interface Driver {
  id: string;
  code: string | null;
  number: string | null;
  name: string;
  familyName: string;
  nationality: string | null;
}

export interface Team {
  id: string;
  name: string;
  nationality: string | null;
}

export interface DriverStanding {
  position: number | null;
  points: number;
  wins: number;
  driver: Driver;
  teams: Team[];
}

export interface ConstructorStanding {
  position: number | null;
  points: number;
  wins: number;
  team: Team;
}

export interface Standings<T> {
  /** Ronda tras la que se calcularon; null si la temporada no ha empezado */
  round: number | null;
  entries: T[];
}

/** Ganador de cada ronda ya disputada: round → piloto y equipo */
export type Winners = Record<number, { driver: Driver; team: Team }>;

/** Clasificado (1, 2…) o código de la API: R retirado, D descalificado, W no salió… */
export type Finish = { classified: true; position: number } | { classified: false; code: string };

export interface RaceResult {
  finish: Finish;
  driver: Driver;
  team: Team;
  /** 0 = salió desde el pit lane; null = sin dato */
  grid: number | null;
  laps: number | null;
  /** Tiempo del ganador o diferencia; null si fue doblado o no terminó */
  time: string | null;
  /** Vueltas perdidas respecto al ganador (doblados) */
  lapsDown: number | null;
  status: string | null;
  points: number;
  fastestLap: boolean;
}

export interface QualifyingResult {
  position: number;
  driver: Driver;
  team: Team;
  q1: string | null;
  q2: string | null;
  q3: string | null;
}

export interface DriverRace {
  round: number;
  name: string;
  team: Team;
  grid: number | null;
  finish: Finish;
  points: number;
}

export interface DriverSeason {
  driver: Driver | null;
  races: DriverRace[];
}
