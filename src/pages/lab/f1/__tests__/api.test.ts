// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { F1ApiError, fetchResource, RATE_LIMIT, resetClient, resources } from "../lib/api";
import * as f from "./fixtures";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("fetchResource", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    localStorage.clear();
    resetClient();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T12:00:00Z"));
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("pide al proxy, normaliza y guarda en localStorage", async () => {
    fetchMock.mockResolvedValue(ok(f.driverStandingsResponse));

    const result = await fetchResource(resources.driverStandings(2026));

    expect(fetchMock).toHaveBeenCalledWith("/api/f1?path=2026%2Fdriverstandings");
    expect(result.stale).toBe(false);
    expect(result.data.entries[0]!.driver.code).toBe("ANT");
    const stored = JSON.parse(localStorage.getItem("f1:v1:2026/driverstandings")!);
    expect(stored.data.round).toBe(2);
  });

  it("no repite la petición mientras la caché es válida, y sí cuando caduca", async () => {
    fetchMock.mockImplementation(async () => ok(f.driverStandingsResponse));
    const res = resources.driverStandings(2026);

    await fetchResource(res);
    vi.setSystemTime(Date.now() + 9 * 60 * 1000);
    await fetchResource(res);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 2 * 60 * 1000); // > 10 min
    await fetchResource(res);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("las temporadas terminadas duran un día en caché", async () => {
    fetchMock.mockImplementation(async () => ok(f.driverStandingsResponse));
    const res = resources.driverStandings(2021);
    await fetchResource(res);
    vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000);
    await fetchResource(res);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("comparte las peticiones simultáneas", async () => {
    fetchMock.mockImplementation(async () => ok(f.scheduleResponse));
    const res = resources.schedule(2026);
    const [a, b] = await Promise.all([fetchResource(res), fetchResource(res)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.data).toBe(b.data);
  });

  it("force se salta la caché", async () => {
    fetchMock.mockImplementation(async () => ok(f.scheduleResponse));
    const res = resources.schedule(2026);
    await fetchResource(res);
    await fetchResource(res, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("si falla y hay copia vieja, la devuelve marcada como stale", async () => {
    fetchMock.mockResolvedValueOnce(ok(f.scheduleResponse));
    const res = resources.schedule(2026);
    await fetchResource(res);

    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    const result = await fetchResource(res, { force: true });
    expect(result.stale).toBe(true);
    expect(result.error?.kind).toBe("network");
    expect(result.data).toHaveLength(4);
  });

  it("errores tipados sin caché", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    await expect(fetchResource(resources.schedule(2025))).rejects.toMatchObject({ kind: "network" });

    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 502 }));
    await expect(fetchResource(resources.schedule(2024))).rejects.toMatchObject({ kind: "server" });

    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    await expect(fetchResource(resources.schedule(2023))).rejects.toMatchObject({ kind: "server" });

    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429, headers: { "Retry-After": "12" } }));
    await expect(fetchResource(resources.schedule(2022))).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfter: 12,
    });
  });

  it("el 429 del Firewall de Vercel (texto, sin Retry-After) espera 60 s", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429, headers: { "Content-Type": "text/plain" } })
    );
    await expect(fetchResource(resources.schedule(2021))).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfter: 60,
    });
  });

  it("un 404 del proxy es not_found y no se tapa con datos viejos", async () => {
    const res = resources.driverSeason(2026, "norris");
    fetchMock.mockResolvedValueOnce(ok(f.driverSeasonResponse));
    await fetchResource(res);

    fetchMock.mockResolvedValueOnce(new Response('{"error":"unknown_driver"}', { status: 404 }));
    await expect(fetchResource(res, { force: true })).rejects.toMatchObject({ kind: "not_found" });
  });

  it("corta en el cliente al pasar el límite, sin llamar a la red", async () => {
    fetchMock.mockImplementation(async () => ok(f.emptyRaces));

    for (let round = 1; round <= RATE_LIMIT.limit; round++) {
      await fetchResource(resources.raceResults(2026, round));
    }
    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT.limit);

    const error = await fetchResource(resources.raceResults(2026, 21)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(F1ApiError);
    expect(error).toMatchObject({ kind: "rate_limit", retryAfter: 60 });
    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT.limit);

    // Lo que ya está en caché se sigue sirviendo
    await expect(fetchResource(resources.raceResults(2026, 1))).resolves.toMatchObject({ stale: false });

    // Pasado el minuto se puede volver a pedir
    vi.setSystemTime(Date.now() + 60 * 1000);
    await fetchResource(resources.raceResults(2026, 21));
    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT.limit + 1);
  });

  it("ignora entradas de caché corruptas", async () => {
    localStorage.setItem("f1:v1:2026/races", '{"nope":true}');
    fetchMock.mockResolvedValue(ok(f.scheduleResponse));
    const result = await fetchResource(resources.schedule(2026));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(4);
  });
});
