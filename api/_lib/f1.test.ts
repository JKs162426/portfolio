// Vive en _lib/: Vercel publicaría como función cualquier archivo de api/ sin "_"
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleF1Request, isAllowedPath, MIN_SEASON } from "../f1";
import { MIN_SEASON as CLIENT_MIN_SEASON } from "../../src/pages/lab/f1/lib/seasons";

// Respuesta mínima compatible con http.ServerResponse
function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as string | null,
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
    },
    end(body: string) {
      res.body = body;
    },
  };
  return res;
}

const NOW = new Date("2026-11-20T12:00:00Z");

async function call(url: string, method = "GET") {
  const res = mockResponse();
  await handleF1Request(
    { url, method } as IncomingMessage,
    res as unknown as ServerResponse,
    NOW
  );
  return res;
}

describe("isAllowedPath", () => {
  it.each([
    "2026/races",
    "2026/driverstandings",
    "2026/constructorstandings",
    "2026/results/1",
    "2026/5/results",
    "2026/21/qualifying",
    "2026/2/sprint",
    "2026/drivers/max_verstappen/results",
    "1950/1/results",
  ])("acepta %s", (path) => {
    expect(isAllowedPath(path, NOW)).toBe(true);
  });

  it.each([
    "current/races", // alias: la caché tendría dos claves para lo mismo
    "2027/races", // temporada futura
    "1949/races", // antes del primer campeonato
    "2026/0/results",
    "2026/05/results", // ceros a la izquierda = otra clave de caché
    "2026/100/results",
    "2026/drivers/Max/results",
    "2026/drivers/../results",
    "2026/laps",
    "2026/5/pitstops",
    "",
  ])("rechaza %s", (path) => {
    expect(isAllowedPath(path, NOW)).toBe(false);
  });

  it("usa la misma temporada mínima que el cliente", () => {
    expect(MIN_SEASON).toBe(CLIENT_MIN_SEASON);
  });
});

describe("handleF1Request", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reenvía la ruta con limit=100 y cachea poco la temporada actual", async () => {
    fetchMock.mockResolvedValue(new Response('{"MRData":{}}', { status: 200 }));

    const res = await call("/?path=2026%2Fdriverstandings");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.jolpi.ca/ergast/f1/2026/driverstandings.json?limit=100");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('{"MRData":{}}');
    expect(res.headers["cache-control"]).toContain("s-maxage=600");
  });

  it("cachea un día las temporadas terminadas", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await call("/?path=2021%2Fraces");
    expect(res.headers["cache-control"]).toContain("s-maxage=86400");
  });

  it.each([
    ["/", "invalid_query"],
    ["/?path=2026%2Fraces&x=1", "invalid_query"],
    ["/?path=2026%2Fraces&path=2026%2Fraces", "invalid_query"],
    ["/?season=2026", "invalid_query"],
    ["/?path=2026%2Flaps", "invalid_path"],
  ])("rechaza %s sin llamar a la API", async (url, error) => {
    const res = await call(url);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body!)).toEqual({ error });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("solo acepta GET", async () => {
    const res = await call("/?path=2026%2Fraces", "POST");
    expect(res.statusCode).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reenvía el 429 con Retry-After y no lo cachea", async () => {
    fetchMock.mockResolvedValue(
      new Response("Too many", { status: 429, headers: { "Retry-After": "30" } })
    );
    const res = await call("/?path=2026%2Fraces");
    expect(res.statusCode).toBe(429);
    expect(res.headers["retry-after"]).toBe("30");
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("convierte un 5xx de la API en 502", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 503 }));
    const res = await call("/?path=2026%2Fraces");
    expect(res.statusCode).toBe(502);
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("distingue timeout (504) de API inaccesible (502)", async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("t"), { name: "TimeoutError" }));
    expect((await call("/?path=2026%2Fraces")).statusCode).toBe(504);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await call("/?path=2026%2Fraces")).statusCode).toBe(502);
  });
});
