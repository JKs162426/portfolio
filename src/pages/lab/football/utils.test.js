import { describe, expect, it } from "vitest";
import {
  clampMonth,
  filterMatches,
  isDateKey,
  matchDates,
  nearestMatchDate,
  paginate,
  searchTeams,
  seasonMonthRange,
  shiftMonth,
  sortTable,
  statusGroup,
} from "./utils";
import { normalizeMatches, normalizeStandings } from "./normalize";
import { rawMatches, rawStandings } from "./fixtures.test-data";

const matches = normalizeMatches(rawMatches);
const { table } = normalizeStandings(rawStandings);
const teams = table.map((r) => r.team);

describe("searchTeams", () => {
  it("busca por nombre, nombre corto y siglas, sin importar mayúsculas", () => {
    expect(searchTeams(teams, "arsenal").map((t) => t.tla)).toEqual(["ARS"]);
    expect(searchTeams(teams, "LIV").map((t) => t.tla)).toEqual(["LIV"]);
    expect(searchTeams(teams, "man").map((t) => t.tla)).toEqual(["MCI", "MUN"]);
    expect(searchTeams(teams, "united").map((t) => t.tla)).toEqual(["MUN"]);
  });

  it("ignora acentos y espacios", () => {
    expect(searchTeams(teams, "  ÁRSENAL ").map((t) => t.tla)).toEqual(["ARS"]);
  });

  it("devuelve vacío sin texto o sin coincidencias", () => {
    expect(searchTeams(teams, "")).toEqual([]);
    expect(searchTeams(teams, "barcelona")).toEqual([]);
  });

  it("reconoce apodos comunes", () => {
    expect(searchTeams(teams, "man utd").map((t) => t.tla)).toEqual(["MUN"]);
  });

  it("prioriza coincidencias exactas", () => {
    expect(searchTeams(teams, "man city")[0].tla).toBe("MCI");
  });
});

describe("statusGroup", () => {
  it("agrupa los estados de la API", () => {
    expect(statusGroup("IN_PLAY")).toBe("live");
    expect(statusGroup("PAUSED")).toBe("live");
    expect(statusGroup("TIMED")).toBe("upcoming");
    expect(statusGroup("FINISHED")).toBe("finished");
    expect(statusGroup("POSTPONED")).toBe("other");
  });
});

describe("filterMatches", () => {
  it("filtra por equipo y mes (criterios combinados)", () => {
    const ids = filterMatches(matches, { teamId: 57, monthKey: "2026-09" }).map((m) => m.id);
    expect(ids).toEqual([1]);
  });

  it("filtra por estado", () => {
    expect(filterMatches(matches, { status: "live" }).map((m) => m.id)).toEqual([3]);
    expect(filterMatches(matches, { teamId: 57, status: "upcoming" }).map((m) => m.id)).toEqual([4]);
  });

  it("filtra por día y ordena por hora", () => {
    const day = matchDates(matches)[0];
    expect(filterMatches(matches, { dateKey: day }).map((m) => m.id)).toEqual([1, 2]);
  });
});

describe("navegación por fechas", () => {
  const dates = ["2026-09-20", "2026-10-04", "2026-10-18"];

  it("encuentra el día con partidos más cercano", () => {
    expect(nearestMatchDate(dates, "2026-10-01")).toBe("2026-10-04");
    expect(nearestMatchDate(dates, "2026-10-04")).toBe("2026-10-04");
    expect(nearestMatchDate(dates, "2026-10-04", 1)).toBe("2026-10-18");
    expect(nearestMatchDate(dates, "2026-10-04", -1)).toBe("2026-09-20");
    expect(nearestMatchDate(dates, "2026-09-20", -1)).toBeNull();
    expect(nearestMatchDate(dates, "2027-01-01")).toBe("2026-10-18");
    expect(nearestMatchDate([], "2027-01-01")).toBeNull();
  });

  it("mueve y limita meses al rango de la temporada", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    const range = seasonMonthRange(matches);
    expect(range).toEqual({ first: "2026-09", last: "2026-11" });
    expect(clampMonth("2026-06", range)).toBe("2026-09");
    expect(clampMonth("2027-03", range)).toBe("2026-11");
    expect(clampMonth("2026-10", range)).toBe("2026-10");
  });

  it("valida fechas de la URL", () => {
    expect(isDateKey("2026-10-04")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("hoy")).toBe(false);
    expect(isDateKey(null)).toBe(false);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, i) => i);

  it("parte en páginas y limita la página pedida", () => {
    expect(paginate(items, 1, 10)).toMatchObject({ page: 1, pageCount: 3 });
    expect(paginate(items, 3, 10).items).toEqual([20, 21, 22]);
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, -1, 10).page).toBe(1);
    expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});

describe("sortTable", () => {
  it("ordena por columna y desempata por posición", () => {
    expect(sortTable(table, "goalsAgainst", "asc").map((r) => r.position)).toEqual([1, 2, 3, 4]);
    expect(sortTable(table, "goalsFor", "desc").map((r) => r.position)).toEqual([1, 3, 2, 4]);
    expect(sortTable(table, "team", "asc").map((r) => r.team.tla)).toEqual(["ARS", "LIV", "MCI", "MUN"]);
  });
});
