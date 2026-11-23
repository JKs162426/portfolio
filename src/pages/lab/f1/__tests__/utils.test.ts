import { describe, expect, it } from "vitest";
import { normalizeDriverSeason, normalizeSchedule, normalizeWinners } from "../lib/normalize";
import { createRateLimiter } from "../lib/rateLimit";
import { isValidSeason, parseSeason, seasonOptions } from "../lib/seasons";
import { teamColor, NEUTRAL_TEAM_COLOR } from "../lib/teams";
import { daysUntil, gapToLeader, nextRace, positionsGained, raceStatuses, summarizeDriver } from "../lib/utils";
import * as f from "./fixtures";

const schedule = normalizeSchedule(f.scheduleResponse);
const winners = normalizeWinners(f.winnersResponse);

describe("raceStatuses", () => {
  it("terminadas, pendientes de resultado, próxima y por disputar", () => {
    // Japón (29 mar) ya se corrió pero aún no tiene ganador
    const now = Date.parse("2026-04-10T00:00:00Z");
    const statuses = raceStatuses(schedule, winners, now);
    expect([...statuses.entries()]).toEqual([
      [1, "done"],
      [2, "done"],
      [3, "pending"],
      [4, "next"],
    ]);
    expect(nextRace(schedule, winners, now)?.name).toBe("Miami Grand Prix");
  });

  it("una carrera en curso sigue siendo la próxima", () => {
    const now = Date.parse("2026-03-29T06:00:00Z"); // 1 h después de la salida
    expect(raceStatuses(schedule, winners, now).get(3)).toBe("next");
  });

  it("temporada terminada: no hay próxima", () => {
    const now = Date.parse("2026-12-31T00:00:00Z");
    expect(nextRace(schedule, winners, now)).toBeNull();
  });
});

describe("summarizeDriver", () => {
  it("cuenta victorias, podios, mejor resultado, abandonos y puntos", () => {
    const { races } = normalizeDriverSeason(f.driverSeasonResponse);
    expect(summarizeDriver(races)).toEqual({ starts: 3, wins: 1, podiums: 1, best: 1, dnfs: 1, points: 37 });
  });

  it("no cuenta como salida un 'no salió' (W)", () => {
    const { races } = normalizeDriverSeason(f.driverSeasonResponse);
    const withDns = [...races, { ...races[0]!, round: 4, finish: { classified: false as const, code: "W" } }];
    expect(summarizeDriver(withDns).starts).toBe(3);
  });

  it("sin carreras", () => {
    expect(summarizeDriver([])).toEqual({ starts: 0, wins: 0, podiums: 0, best: null, dnfs: 0, points: 0 });
  });
});

describe("helpers", () => {
  it("gapToLeader", () => {
    expect(gapToLeader(43, 43)).toBeNull();
    expect(gapToLeader(32.5, 43)).toBe(10.5);
    expect(gapToLeader(10, undefined)).toBeNull();
  });

  it("positionsGained ignora el pit lane y la salida desconocida", () => {
    expect(positionsGained(5, 2)).toBe(3);
    expect(positionsGained(1, 4)).toBe(-3);
    expect(positionsGained(0, 10)).toBeNull();
    expect(positionsGained(null, 1)).toBeNull();
  });

  it("daysUntil", () => {
    const now = Date.parse("2026-11-20T12:00:00Z");
    expect(daysUntil("2026-11-22T04:00:00Z", now)).toBe(2);
    expect(daysUntil("2026-11-19T00:00:00Z", now)).toBe(0);
  });

  it("teamColor", () => {
    expect(teamColor("ferrari")).toBe("#e8002d");
    expect(teamColor("brabham")).toBe(NEUTRAL_TEAM_COLOR);
    expect(teamColor(undefined)).toBe(NEUTRAL_TEAM_COLOR);
  });
});

describe("seasons", () => {
  const now = new Date("2026-11-20T00:00:00Z");

  it("parseSeason cae en la temporada actual ante valores inválidos", () => {
    expect(parseSeason("2008", now)).toBe(2008);
    expect(parseSeason(null, now)).toBe(2026);
    expect(parseSeason("1949", now)).toBe(2026);
    expect(parseSeason("2027", now)).toBe(2026);
    expect(parseSeason("20.5", now)).toBe(2026);
  });

  it("seasonOptions va de la actual a 1950", () => {
    const options = seasonOptions(now);
    expect(options[0]).toBe(2026);
    expect(options.at(-1)).toBe(1950);
    expect(options).toHaveLength(77);
    expect(isValidSeason(1950, now)).toBe(true);
  });
});

describe("createRateLimiter", () => {
  it("deja pasar hasta el límite y luego dice cuánto esperar", () => {
    let t = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect([limiter.take(), limiter.take(), limiter.take()]).toEqual([0, 0, 0]);
    t = 400;
    expect(limiter.take()).toBe(600);
    // Las tres salen de la ventana a la vez
    t = 1000;
    expect([limiter.take(), limiter.take(), limiter.take()]).toEqual([0, 0, 0]);
    t = 1500;
    expect(limiter.take()).toBe(500);
  });

  it("los intentos rechazados no ocupan hueco", () => {
    let t = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    limiter.take();
    t = 500;
    limiter.take();
    limiter.take();
    t = 1000;
    expect(limiter.take()).toBe(0);
  });
});
