import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleFootballRequest } from "./footballProxy.js";

// Respuesta mínima compatible con http.ServerResponse
function mockResponse() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: null,
    setHeader: (name, value) => {
      headers[name.toLowerCase()] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

const request = (url, method = "GET") => ({ url, method });

describe("handleFootballRequest", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reenvía rutas permitidas con la API key", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"ok":true}', { status: 200, headers: { "X-Requests-Available-Minute": "9" } })
    );
    const res = mockResponse();

    // El cliente real codifica el path: competitions%2FPL%2Fmatches
    await handleFootballRequest(request("/?path=competitions%2FPL%2Fmatches"), res, "secret");

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.football-data.org/v4/competitions/PL/matches");
    expect(options.headers["X-Auth-Token"]).toBe("secret");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('{"ok":true}');
    expect(res.headers["x-requests-available-minute"]).toBe("9");
    expect(res.headers["cache-control"]).toContain("s-maxage=60");
  });

  // Cada variante sería una URL distinta para la CDN: un MISS que gasta cuota
  it.each([
    ["parámetro desconocido", "/?path=competitions/PL/standings&x=123"],
    ["filtros que la app no usa", "/?path=competitions/PL/matches&dateFrom=2026-10-01"],
    ["path repetido", "/?path=competitions/PL/standings&path=1"],
    ["parámetro vacío", "/?path=competitions/PL/standings&="],
    ["sin path", "/?x=1"],
    ["sin parámetros", "/"],
  ])("rechaza consultas que romperían la caché: %s", async (_, url) => {
    const res = mockResponse();
    await handleFootballRequest(request(url), res, "secret");
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["PD/standings", "SA/matches", "BL1/standings", "FL1/matches", "CL/standings", "CLI/matches"])(
    "acepta las competiciones disponibles: %s",
    async (path) => {
      fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
      const res = mockResponse();
      await handleFootballRequest(request(`/?path=competitions/${path}`), res, "secret");
      expect(res.statusCode).toBe(200);
    }
  );

  it.each(["competitions/CSA/matches", "competitions/PL/scorers", "teams/57", "matches/abc", "matches/0007", "matches/0", "matches/12345678901", "../secret", ""])(
    "rechaza rutas fuera de la lista blanca: %s",
    async (path) => {
      const res = mockResponse();
      await handleFootballRequest(request(`/?path=${path}`), res, "secret");
      expect(res.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("avisa si falta la API key", async () => {
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1"), res, undefined);
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("missing_key");
  });

  it("solo acepta GET", async () => {
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1", "POST"), res, "secret");
    expect(res.statusCode).toBe(405);
  });

  it("devuelve 502 si la API no responde", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1"), res, "secret");
    expect(res.statusCode).toBe(502);
  });

  it("devuelve 504 si la API tarda demasiado", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1"), res, "secret");
    expect(res.statusCode).toBe(504);
    expect(JSON.parse(res.body).error).toBe("upstream_timeout");
  });

  it("cachea los 404 para que repetirlos no gaste cuota", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"not found"}', { status: 404 }));
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/999999999"), res, "secret");
    expect(res.statusCode).toBe(404);
    expect(res.headers["cache-control"]).toBe("public, s-maxage=3600");
  });

  it("propaga el 429 sin cachearlo", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429, headers: { "X-RequestCounter-Reset": "30" } }));
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1"), res, "secret");
    expect(res.statusCode).toBe(429);
    expect(res.headers["x-requestcounter-reset"]).toBe("30");
    expect(res.headers["cache-control"]).toBeUndefined();
  });
});
