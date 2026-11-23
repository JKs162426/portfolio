// Respuestas de ejemplo con la forma real de Jolpica-F1 (recortadas)
import type { RawDriver, RawConstructor, RawResponse } from "../lib/types";

const driver = (driverId: string, givenName: string, familyName: string, code: string, number: string): RawDriver => ({
  driverId,
  permanentNumber: number,
  code,
  givenName,
  familyName,
  nationality: "British",
});
const team = (constructorId: string, name: string): RawConstructor => ({ constructorId, name, nationality: "British" });

export const NORRIS = driver("norris", "Lando", "Norris", "NOR", "1");
export const ANTONELLI = driver("antonelli", "Andrea Kimi", "Antonelli", "ANT", "12");
export const BOTTAS = driver("bottas", "Valtteri", "Bottas", "BOT", "77");
export const MCLAREN = team("mclaren", "McLaren");
export const MERCEDES = team("mercedes", "Mercedes");
export const CADILLAC = team("cadillac", "Cadillac F1 Team");

const circuit = (name: string, locality: string, country: string) => ({
  circuitName: name,
  Location: { locality, country },
});

export const scheduleResponse: RawResponse = {
  MRData: {
    RaceTable: {
      Races: [
        {
          season: "2026",
          round: "1",
          raceName: "Australian Grand Prix",
          date: "2026-03-08",
          time: "04:00:00Z",
          Circuit: circuit("Albert Park Grand Prix Circuit", "Melbourne", "Australia"),
          FirstPractice: { date: "2026-03-06", time: "01:30:00Z" },
          Qualifying: { date: "2026-03-07", time: "05:00:00Z" },
        },
        {
          season: "2026",
          round: "2",
          raceName: "Chinese Grand Prix",
          date: "2026-03-15",
          time: "07:00:00Z",
          Circuit: circuit("Shanghai International Circuit", "Shanghai", "China"),
          FirstPractice: { date: "2026-03-13", time: "03:30:00Z" },
          SprintQualifying: { date: "2026-03-13", time: "07:30:00Z" },
          Sprint: { date: "2026-03-14", time: "03:00:00Z" },
          Qualifying: { date: "2026-03-14", time: "07:00:00Z" },
        },
        {
          season: "2026",
          round: "3",
          raceName: "Japanese Grand Prix",
          date: "2026-03-29",
          time: "05:00:00Z",
          Circuit: circuit("Suzuka Circuit", "Suzuka", "Japan"),
        },
        {
          season: "2026",
          round: "4",
          raceName: "Miami Grand Prix",
          date: "2026-05-03",
          time: "20:00:00Z",
          Circuit: circuit("Miami International Autodrome", "Miami", "USA"),
        },
      ],
    },
  },
};

export const winnersResponse: RawResponse = {
  MRData: {
    RaceTable: {
      Races: [
        { ...scheduleResponse.MRData!.RaceTable!.Races![0]!, Results: [result(ANTONELLI, MERCEDES, "1", "25")] },
        { ...scheduleResponse.MRData!.RaceTable!.Races![1]!, Results: [result(NORRIS, MCLAREN, "1", "25")] },
      ],
    },
  },
};

function result(d: RawDriver, c: RawConstructor, positionText: string, points: string, extra = {}) {
  return {
    number: d.permanentNumber,
    position: /^\d+$/.test(positionText) ? positionText : "20",
    positionText,
    points,
    grid: "3",
    laps: "58",
    status: "Finished",
    Driver: d,
    Constructor: c,
    Time: { time: "1:35:23.504" },
    ...extra,
  };
}

export const raceResultsResponse: RawResponse = {
  MRData: {
    RaceTable: {
      Races: [
        {
          ...scheduleResponse.MRData!.RaceTable!.Races![1]!,
          Results: [
            result(NORRIS, MCLAREN, "1", "25", { grid: "1", FastestLap: { rank: "1", lap: "52", Time: { time: "1:12.983" } } }),
            result(ANTONELLI, MERCEDES, "2", "18", { grid: "5", Time: { time: "+3.120" } }),
            result(BOTTAS, CADILLAC, "R", "0", { grid: "0", laps: "12", status: "Retired", Time: undefined }),
            // Doblado: la API trae un "tiempo" que no es la diferencia con el ganador
            { ...result(NORRIS, MCLAREN, "3", "15", { laps: "56", status: "Lapped", Time: { time: "+4.427" } }), Driver: { ...NORRIS, driverId: "lapped", code: "LAP" } },
          ],
        },
      ],
    },
  },
};

export const qualifyingResponse: RawResponse = {
  MRData: {
    RaceTable: {
      Races: [
        {
          ...scheduleResponse.MRData!.RaceTable!.Races![1]!,
          QualifyingResults: [
            { position: "1", Driver: NORRIS, Constructor: MCLAREN, Q1: "1:30.939", Q2: "1:29.207", Q3: "1:27.470" },
            { position: "2", Driver: BOTTAS, Constructor: CADILLAC, Q1: "1:41.564" },
          ],
        },
      ],
    },
  },
};

export const driverStandingsResponse: RawResponse = {
  MRData: {
    StandingsTable: {
      StandingsLists: [
        {
          round: "2",
          DriverStandings: [
            { position: "1", positionText: "1", points: "43", wins: "1", Driver: ANTONELLI, Constructors: [MERCEDES] },
            { position: "2", positionText: "2", points: "32.5", wins: "1", Driver: NORRIS, Constructors: [MCLAREN] },
            { position: "3", positionText: "3", points: "0", wins: "0", Driver: BOTTAS, Constructors: [CADILLAC] },
          ],
        },
      ],
    },
  },
};

export const constructorStandingsResponse: RawResponse = {
  MRData: {
    StandingsTable: {
      StandingsLists: [
        {
          round: "2",
          ConstructorStandings: [
            { position: "1", positionText: "1", points: "61", wins: "1", Constructor: MERCEDES },
            { position: "2", positionText: "2", points: "50", wins: "1", Constructor: MCLAREN },
            { position: "3", positionText: "3", points: "0", wins: "0", Constructor: CADILLAC },
          ],
        },
      ],
    },
  },
};

export const driverSeasonResponse: RawResponse = {
  MRData: {
    RaceTable: {
      Races: [
        { ...scheduleResponse.MRData!.RaceTable!.Races![0]!, Results: [result(NORRIS, MCLAREN, "4", "12", { grid: "2" })] },
        { ...scheduleResponse.MRData!.RaceTable!.Races![1]!, Results: [result(NORRIS, MCLAREN, "1", "25", { grid: "1" })] },
        { ...scheduleResponse.MRData!.RaceTable!.Races![2]!, Results: [result(NORRIS, MCLAREN, "R", "0", { grid: "6" })] },
      ],
    },
  },
};

export const emptyRaces: RawResponse = { MRData: { RaceTable: { Races: [] } } };
export const emptyStandings: RawResponse = { MRData: { StandingsTable: { StandingsLists: [] } } };
