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

  it("reenvía rutas permitidas con la API key y los filtros válidos", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"ok":true}', { status: 200, headers: { "X-Requests-Available-Minute": "9" } })
    );
    const res = mockResponse();

    await handleFootballRequest(
      request("/?path=competitions/PL/matches&dateFrom=2026-10-01&evil=1"),
      res,
      "secret"
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-10-01");
    expect(options.headers["X-Auth-Token"]).toBe("secret");
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('{"ok":true}');
    expect(res.headers["x-requests-available-minute"]).toBe("9");
    expect(res.headers["cache-control"]).toContain("s-maxage");
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

  it.each(["competitions/CSA/matches", "competitions/PL/scorers", "teams/57", "matches/abc", "../secret", ""])(
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

  it("propaga el 429 sin cachearlo", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429, headers: { "X-RequestCounter-Reset": "30" } }));
    const res = mockResponse();
    await handleFootballRequest(request("/?path=matches/1"), res, "secret");
    expect(res.statusCode).toBe(429);
    expect(res.headers["x-requestcounter-reset"]).toBe("30");
    expect(res.headers["cache-control"]).toBeUndefined();
  });
});
