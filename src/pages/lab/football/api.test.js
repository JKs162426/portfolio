import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FootballApiError, RESOURCES, fetchResource } from "./api";
import { rawStandings } from "./fixtures.test-data";

function jsonResponse(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  };
}

// localStorage en memoria (los tests corren en Node)
function memoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("fetchResource", () => {
  let fetchMock;

  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("pide al proxy, normaliza y guarda en caché", async () => {
    fetchMock.mockResolvedValue(jsonResponse(rawStandings));

    const first = await fetchResource(RESOURCES.standings);
    expect(fetchMock).toHaveBeenCalledWith("/api/football?path=competitions%2FPL%2Fstandings");
    expect(first.data.table[0].team.tla).toBe("LIV");

    // Segunda llamada: sale de la caché, sin petición
    const second = await fetchResource(RESOURCES.standings);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.data).toEqual(first.data);
  });

  it("vuelve a pedir cuando la caché caduca o se fuerza", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(rawStandings));

    await fetchResource(RESOURCES.standings);
    vi.advanceTimersByTime(11 * 60 * 1000);
    await fetchResource(RESOURCES.standings);
    await fetchResource(RESOURCES.standings, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("comparte la petición si se pide dos veces a la vez", async () => {
    fetchMock.mockResolvedValue(jsonResponse(rawStandings));
    await Promise.all([fetchResource(RESOURCES.standings), fetchResource(RESOURCES.standings)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("devuelve datos viejos marcados como stale si la red falla", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(jsonResponse(rawStandings));
    await fetchResource(RESOURCES.standings);

    vi.advanceTimersByTime(11 * 60 * 1000);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await fetchResource(RESOURCES.standings);
    expect(result.stale).toBe(true);
    expect(result.data.table).toHaveLength(4);
  });

  it.each([
    [() => Promise.reject(new TypeError("offline")), "network"],
    [() => Promise.resolve(jsonResponse({}, 429, { "x-requestcounter-reset": "42" })), "rate_limit"],
    [() => Promise.resolve(jsonResponse({ error: "missing_key" }, 500)), "config"],
    [() => Promise.resolve(jsonResponse({ message: "forbidden" }, 403)), "auth"],
    [() => Promise.resolve(jsonResponse({}, 503)), "server"],
  ])("traduce los errores sin caché (%#)", async (impl, kind) => {
    fetchMock.mockImplementation(impl);
    const error = await fetchResource(RESOURCES.standings).catch((e) => e);
    expect(error).toBeInstanceOf(FootballApiError);
    expect(error.kind).toBe(kind);
    if (kind === "rate_limit") expect(error.retryAfter).toBe(42);
  });
});
