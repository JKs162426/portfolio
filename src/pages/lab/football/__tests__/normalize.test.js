import { describe, expect, it } from "vitest";
import { normalizeMatchDetail, normalizeMatches, normalizeStandings } from "../lib/normalize";
import { ARS, MCI, rawMatches, rawStandings } from "./fixtures.test-data.js";

describe("normalizeStandings", () => {
  it("usa la tabla TOTAL y renombra los campos", () => {
    const { table, season } = normalizeStandings(rawStandings);
    expect(table).toHaveLength(4);
    expect(table[0]).toMatchObject({
      position: 1,
      points: 19,
      played: 7,
      goalsFor: 15,
      goalsAgainst: 4,
      team: { id: 64, shortName: "Liverpool", tla: "LIV" },
    });
    expect(season.currentMatchday).toBe(7);
  });

  it("no rompe con respuestas vacías o raras", () => {
    expect(normalizeStandings(null).table).toEqual([]);
    expect(normalizeStandings({ standings: [] }).table).toEqual([]);
  });
});

describe("normalizeMatches", () => {
  it("descarta partidos sin fecha y aplana el marcador", () => {
    const matches = normalizeMatches(rawMatches);
    expect(matches).toHaveLength(5);
    expect(matches[0]).toMatchObject({
      id: 1,
      status: "FINISHED",
      score: { home: 2, away: 1 },
      referee: "Michael Oliver",
    });
  });

  it("acepta equipos por confirmar", () => {
    const [match] = normalizeMatches({
      matches: [{ id: 9, utcDate: "2027-01-01T12:00:00Z", status: "TIMED", homeTeam: { id: null }, awayTeam: null }],
    });
    expect(match.homeTeam).toBeNull();
    expect(match.awayTeam).toBeNull();
    expect(match.score.home).toBeNull();
  });
});

describe("normalizeMatchDetail", () => {
  it("incluye goles y alineaciones cuando la API los trae", () => {
    const detail = normalizeMatchDetail({
      ...rawMatches.matches[0],
      homeTeam: { ...ARS, formation: "4-3-3", lineup: [{ id: 1, name: "Saka", shirtNumber: 7 }], bench: [] },
      awayTeam: MCI,
      goals: [{ minute: 45, injuryTime: 2, type: "PENALTY", team: { id: 57 }, scorer: { name: "Saka" } }],
    });
    expect(detail.goals[0]).toMatchObject({ minute: 45, injuryTime: 2, type: "PENALTY", teamId: 57, scorer: "Saka" });
    expect(detail.home.formation).toBe("4-3-3");
    expect(detail.home.lineup[0].shirtNumber).toBe(7);
    expect(detail.away.lineup).toEqual([]);
  });

  it("deja listas vacías si el plan gratuito no trae extras", () => {
    const detail = normalizeMatchDetail(rawMatches.matches[0]);
    expect(detail.goals).toEqual([]);
    expect(detail.home.statistics).toBeNull();
  });
});
