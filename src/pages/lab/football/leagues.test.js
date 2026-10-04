import { describe, expect, it } from "vitest";
import { getLeague, isLeagueCode, zoneFor } from "./leagues";
import { normalizeTeam } from "./normalize";

const kinds = (code, positions, size, key = "zones") =>
  positions.map((p) => zoneFor(getLeague(code)[key], p, size)?.kind ?? null);

describe("leagues", () => {
  it("valida códigos y cae en la Premier League si no existe", () => {
    expect(isLeagueCode("PD")).toBe(true);
    expect(isLeagueCode("CL")).toBe(true);
    expect(isLeagueCode("CSA")).toBe(false);
    expect(getLeague("XYZ").code).toBe("PL");
  });

  it("marca las zonas de las ligas", () => {
    expect(kinds("PL", [1, 4, 5, 17, 18, 20], 20)).toEqual(["top", "top", null, null, "bottom", "bottom"]);
    // Bundesliga: 18 equipos, 16.º juega la promoción
    expect(kinds("BL1", [15, 16, 17, 18], 18)).toEqual([null, "playoff", "bottom", "bottom"]);
    // Ligue 1: 3 plazas de Champions
    expect(kinds("FL1", [3, 4], 18)).toEqual(["top", null]);
  });

  it("marca las zonas de la fase liga de la Champions", () => {
    expect(kinds("CL", [1, 8, 9, 24, 25, 36], 36)).toEqual([
      "top", "top", "playoff", "playoff", "bottom", "bottom",
    ]);
  });

  it("marca las zonas de los grupos de la Libertadores", () => {
    expect(kinds("CLI", [1, 2, 3, 4], 4, "groupZones")).toEqual(["top", "top", "playoff", null]);
  });

  it("limpia siglas con espacios (Estrasburgo: 'RC ')", () => {
    expect(normalizeTeam({ id: 576, name: "RC Strasbourg Alsace", tla: "RC " }).tla).toBe("RC");
  });
});
