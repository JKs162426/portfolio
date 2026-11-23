import { describe, expect, it } from "vitest";
import {
  normalizeConstructorStandings,
  normalizeDriverSeason,
  normalizeDriverStandings,
  normalizeFinish,
  normalizeQualifying,
  normalizeRaceResults,
  normalizeSchedule,
  normalizeWinners,
} from "../lib/normalize";
import * as f from "./fixtures";

describe("normalizeSchedule", () => {
  it("ordena las sesiones y detecta los fines de semana con sprint", () => {
    const [australia, china] = normalizeSchedule(f.scheduleResponse);
    expect(australia).toMatchObject({
      season: 2026,
      round: 1,
      name: "Australian Grand Prix",
      locality: "Melbourne",
      start: "2026-03-08T04:00:00Z",
      hasTime: true,
      hasSprint: false,
    });
    expect(australia!.sessions.map((s) => s.kind)).toEqual(["fp1", "qualifying", "race"]);
    expect(china!.hasSprint).toBe(true);
    expect(china!.sessions.map((s) => s.kind)).toEqual(["fp1", "sprintQualifying", "sprint", "qualifying", "race"]);
  });

  it("acepta carreras antiguas sin hora", () => {
    const [race] = normalizeSchedule({
      MRData: {
        RaceTable: {
          Races: [
            {
              season: "1950",
              round: "1",
              raceName: "British Grand Prix",
              date: "1950-05-13",
              Circuit: { circuitName: "Silverstone Circuit", Location: { locality: "Silverstone", country: "UK" } },
            },
          ],
        },
      },
    });
    expect(race).toMatchObject({ start: "1950-05-13", hasTime: false });
    expect(race!.sessions).toEqual([{ kind: "race", start: "1950-05-13", hasTime: false }]);
  });

  it("devuelve [] ante respuestas vacías o rotas", () => {
    expect(normalizeSchedule(f.emptyRaces)).toEqual([]);
    expect(normalizeSchedule(null)).toEqual([]);
    expect(normalizeSchedule({ foo: 1 })).toEqual([]);
  });
});

describe("resultados", () => {
  it("ganadores por ronda", () => {
    const winners = normalizeWinners(f.winnersResponse);
    expect(Object.keys(winners)).toEqual(["1", "2"]);
    expect(winners[2]!.driver.code).toBe("NOR");
    expect(winners[2]!.team.id).toBe("mclaren");
  });

  it("carrera: posición, abandono, pit lane, doblados y vuelta rápida", () => {
    const [p1, p2, out, lapped] = normalizeRaceResults(f.raceResultsResponse);
    expect(lapped).toMatchObject({ time: null, lapsDown: 2, status: "Lapped" });
    expect(p2!.lapsDown).toBeNull();
    expect(p1).toMatchObject({ finish: { classified: true, position: 1 }, grid: 1, points: 25, fastestLap: true });
    expect(p2).toMatchObject({ time: "+3.120", fastestLap: false });
    expect(out).toMatchObject({
      finish: { classified: false, code: "R" },
      grid: 0,
      time: null,
      status: "Retired",
      points: 0,
    });
  });

  it("clasificación: Q2 y Q3 vacíos para quien cayó en Q1", () => {
    const [pole, last] = normalizeQualifying(f.qualifyingResponse);
    expect(pole).toMatchObject({ position: 1, q3: "1:27.470" });
    expect(last).toMatchObject({ position: 2, q1: "1:41.564", q2: null, q3: null });
  });

  it("temporada de un piloto", () => {
    const season = normalizeDriverSeason(f.driverSeasonResponse);
    expect(season.driver?.name).toBe("Lando Norris");
    expect(season.races.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(normalizeDriverSeason(f.emptyRaces)).toEqual({ driver: null, races: [] });
  });

  it("normalizeFinish", () => {
    expect(normalizeFinish("12")).toEqual({ classified: true, position: 12 });
    expect(normalizeFinish("D")).toEqual({ classified: false, code: "D" });
    expect(normalizeFinish("")).toEqual({ classified: false, code: "?" });
  });
});

describe("clasificaciones", () => {
  it("pilotos, con medios puntos", () => {
    const standings = normalizeDriverStandings(f.driverStandingsResponse);
    expect(standings.round).toBe(2);
    expect(standings.entries[1]).toMatchObject({ position: 2, points: 32.5, wins: 1 });
    expect(standings.entries[1]!.teams.map((t) => t.id)).toEqual(["mclaren"]);
  });

  it("constructores", () => {
    const standings = normalizeConstructorStandings(f.constructorStandingsResponse);
    expect(standings.entries.map((e) => e.team.id)).toEqual(["mercedes", "mclaren", "cadillac"]);
  });

  it("temporada sin empezar", () => {
    expect(normalizeDriverStandings(f.emptyStandings)).toEqual({ round: null, entries: [] });
    expect(normalizeConstructorStandings(f.emptyStandings)).toEqual({ round: null, entries: [] });
  });
});
