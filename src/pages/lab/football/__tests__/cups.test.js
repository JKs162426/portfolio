import { describe, expect, it } from "vitest";
import { normalizeMatch, normalizeScore, normalizeStandings } from "../lib/normalize";
import { computeGroupTables, isKnockoutStage, knockoutRounds, resultFor } from "../lib/utils";
import { matchContext, scoreNote } from "../lib/format";
import { getLeague } from "../lib/leagues";
import content from "../../../../data/content";

const t = content.en.football;
const A = { id: 1, name: "Flamengo", shortName: "Flamengo", tla: "FLA" };
const B = { id: 2, name: "River Plate", shortName: "River", tla: "RIV" };
const C = { id: 3, name: "Boca Juniors", shortName: "Boca", tla: "BOC" };

function match(id, stage, group, home, away, h, a, extra = {}) {
  return normalizeMatch({
    id,
    utcDate: `2026-0${id < 10 ? 4 : 9}-${String((id % 27) + 1).padStart(2, "0")}T20:00:00Z`,
    status: h == null ? "TIMED" : "FINISHED",
    stage,
    group,
    matchday: stage === "GROUP_STAGE" ? 1 : null,
    homeTeam: home,
    awayTeam: away,
    score: { fullTime: { home: h, away: a }, ...extra },
  });
}

describe("normalizeScore", () => {
  it("separa los penales del marcador (la API los suma en fullTime)", () => {
    // Caso real de la API: 1–0 en el partido y 5–3 en la tanda llega como 6–3
    const score = normalizeScore({
      winner: "HOME_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 6, away: 3 },
      halfTime: { home: 1, away: 0 },
      regularTime: { home: 1, away: 0 },
      penalties: { home: 5, away: 3 },
    });
    expect(score).toMatchObject({ home: 1, away: 0, penHome: 5, penAway: 3, winner: "HOME_TEAM" });
    expect(scoreNote(score, t)).toBe("5–3 pen.");
  });

  it("deja igual los partidos normales y marca la prórroga", () => {
    expect(normalizeScore({ duration: "REGULAR", fullTime: { home: 2, away: 1 } })).toMatchObject({ home: 2, away: 1, penHome: null });
    expect(scoreNote(normalizeScore({ duration: "EXTRA_TIME", fullTime: { home: 2, away: 1 } }), t)).toBe("AET");
  });
});

describe("resultFor", () => {
  it("usa el ganador de la API cuando hubo penales", () => {
    // 1–1 en el partido y 5–6 en la tanda: la API envía fullTime 6–7
    const m = match(20, "QUARTER_FINALS", null, A, B, 6, 7, {
      winner: "AWAY_TEAM", duration: "PENALTY_SHOOTOUT", penalties: { home: 5, away: 6 },
    });
    expect(m.score).toMatchObject({ home: 1, away: 1, penHome: 5, penAway: 6 });
    // Un 1–1 decidido por penales no es empate para ninguno de los dos
    expect(resultFor(m, B.id)).toBe("won");
    expect(resultFor(m, A.id)).toBe("lost");
  });
});

describe("computeGroupTables", () => {
  it("calcula puntos, goles y orden de cada grupo con los partidos terminados", () => {
    const matches = [
      match(1, "GROUP_STAGE", "GROUP_B", A, B, 2, 0),
      match(2, "GROUP_STAGE", "GROUP_B", B, C, 1, 1),
      match(3, "GROUP_STAGE", "GROUP_B", C, A, 0, 0),
      match(4, "GROUP_STAGE", "GROUP_B", A, C), // por jugar: no suma
      match(5, "QUARTER_FINALS", null, A, B, 1, 0), // no es de grupo
    ];
    const [group] = computeGroupTables(matches);
    expect(group.name).toBe("GROUP_B");
    expect(group.table.map((r) => [r.position, r.team.tla, r.points, r.played, r.goalsFor, r.goalsAgainst])).toEqual([
      [1, "FLA", 4, 2, 2, 0],
      [2, "BOC", 2, 2, 1, 1],
      [3, "RIV", 1, 2, 1, 3],
    ]);
  });
});

describe("fases", () => {
  it("distingue grupos, fases previas y eliminatorias", () => {
    expect(isKnockoutStage("GROUP_STAGE")).toBe(false);
    expect(isKnockoutStage("LEAGUE_STAGE")).toBe(false);
    expect(isKnockoutStage("ROUND_2")).toBe(false);
    expect(isKnockoutStage("SEMI_FINALS")).toBe(true);
    expect(isKnockoutStage("PLAY_OFFS")).toBe(true);
  });

  it("agrupa las eliminatorias en orden cronológico", () => {
    const rounds = knockoutRounds([
      match(12, "SEMI_FINALS", null, A, B, null, null),
      match(11, "QUARTER_FINALS", null, A, C, 1, 0),
      match(1, "GROUP_STAGE", "GROUP_A", A, B, 1, 0),
    ]);
    expect(rounds.map((r) => r.stage)).toEqual(["QUARTER_FINALS", "SEMI_FINALS"]);
  });

  it("describe cada partido según su fase", () => {
    const cli = getLeague("CLI");
    expect(matchContext(match(1, "GROUP_STAGE", "GROUP_C", A, B, 1, 0), t, cli)).toBe("Group C · Matchday 1");
    // En la Libertadores, PLAY_OFFS son los octavos
    expect(matchContext(match(13, "PLAY_OFFS", null, A, B, 1, 0), t, cli)).toBe("Round of 16");
    expect(matchContext(match(14, "PLAYOFFS", null, A, B, 1, 0), t, getLeague("CL"))).toBe("Knockout play-offs");
  });
});

describe("normalizeStandings con grupos", () => {
  it("devuelve todos los grupos TOTAL", () => {
    const row = (team, position) => ({ position, team, playedGames: 0, points: 0 });
    const s = normalizeStandings({
      standings: [
        { type: "TOTAL", group: "GROUP_A", table: [row(A, 1)] },
        { type: "HOME", group: "GROUP_A", table: [row(A, 1)] },
        { type: "TOTAL", group: "GROUP_B", table: [row(B, 1), row(C, 2)] },
      ],
    });
    expect(s.groups.map((g) => [g.name, g.table.length])).toEqual([["GROUP_A", 1], ["GROUP_B", 2]]);
    expect(s.table).toHaveLength(1);
  });
});
