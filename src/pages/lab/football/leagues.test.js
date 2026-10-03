import { describe, expect, it } from "vitest";
import { getLeague, isLeagueCode, zoneFor } from "./leagues";
import { normalizeTeam } from "./normalize";

describe("leagues", () => {
  it("valida códigos y cae en la Premier League si no existe", () => {
    expect(isLeagueCode("PD")).toBe(true);
    expect(isLeagueCode("CL")).toBe(false);
    expect(getLeague("XYZ").code).toBe("PL");
  });

  it("marca las zonas según la liga", () => {
    const pl = getLeague("PL");
    expect([1, 4, 5, 17, 18, 20].map((p) => zoneFor(pl, p, 20))).toEqual([
      "top", "top", null, null, "bottom", "bottom",
    ]);
    // Bundesliga: 18 equipos, 16.º juega la promoción
    const bl = getLeague("BL1");
    expect([15, 16, 17, 18].map((p) => zoneFor(bl, p, 18))).toEqual([
      null, "playoff", "bottom", "bottom",
    ]);
    // Ligue 1: 3 plazas de Champions
    expect(zoneFor(getLeague("FL1"), 4, 18)).toBeNull();
  });

  it("limpia siglas con espacios (Estrasburgo: 'RC ')", () => {
    expect(normalizeTeam({ id: 576, name: "RC Strasbourg Alsace", tla: "RC " }).tla).toBe("RC");
  });
});
