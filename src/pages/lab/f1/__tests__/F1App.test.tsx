// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { useEffect } from "react";
import { cleanup, configure, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { LanguageProvider } from "../../../../context/LanguageContext";
import F1App from "../F1App";
import { resetClient } from "../lib/api";
import * as f from "./fixtures";

configure({ asyncUtilTimeout: 3000 });

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

// Simula el proxy /api/f1 según la ruta pedida (cualquier temporada)
function apiMock(url: string) {
  const path = new URL(url, "http://localhost").searchParams.get("path") ?? "";
  const rest = path.slice(5);
  if (rest === "races") return json(f.scheduleResponse);
  if (rest === "results/1") return json(f.winnersResponse);
  if (rest === "driverstandings") return json(f.driverStandingsResponse);
  if (rest === "constructorstandings") return json(f.constructorStandingsResponse);
  if (rest === "2/results") return json(f.raceResultsResponse);
  if (rest === "2/qualifying") return json(f.qualifyingResponse);
  if (rest === "2/sprint") return json(f.emptyRaces);
  if (rest === "drivers/norris/results") return json(f.driverSeasonResponse);
  return json(f.emptyRaces);
}

let currentUrl = "";
function LocationSpy() {
  const location = useLocation();
  useEffect(() => {
    currentUrl = location.pathname + location.search;
  }, [location]);
  return null;
}

function renderApp(entry = "/lab/f1") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[entry]}>
        <LocationSpy />
        <Routes>
          <Route path="/lab/f1" element={<F1App />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );
}

// Fila del calendario (la tarjeta de "próxima carrera" también nombra la carrera)
async function raceButton(name: string) {
  const list = await screen.findByRole("list");
  return within(list).getByRole("button", { name: new RegExp(name) });
}

const requestedPaths = (mock: Mock) =>
  mock.mock.calls.map(([url]) => new URL(String(url), "http://localhost").searchParams.get("path"));

describe("F1App", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    // "Hoy" = 10 abr 2026: rondas 1 y 2 terminadas, Japón sin resultados, Miami próxima
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-04-10T12:00:00Z"));
    localStorage.clear();
    resetClient();
    fetchMock = vi.fn(apiMock);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra el calendario con la próxima carrera y los ganadores (2 peticiones)", async () => {
    renderApp();

    const next = await screen.findByRole("button", { name: /Next race.*Miami Grand Prix/ });
    expect(next).toBeTruthy();
    expect(await screen.findByText("NOR")).toBeTruthy();
    expect(screen.getByText("ANT")).toBeTruthy();
    expect(screen.getByText("Results pending")).toBeTruthy();
    expect(requestedPaths(fetchMock).sort()).toEqual(["2026/races", "2026/results/1"]);
  });

  it("abre una carrera: resultados, sprint y clasificación bajo demanda", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await raceButton("Chinese Grand Prix"));
    const dialog = await screen.findByRole("dialog", { name: "Chinese Grand Prix" });
    expect(currentUrl).toBe("/lab/f1?round=2");

    const rows = await within(dialog).findAllByRole("row");
    expect(rows[1]!.textContent).toContain("Lando Norris");
    expect(within(dialog).getByText("Pit lane")).toBeTruthy();
    expect(within(dialog).getByText("DNF")).toBeTruthy();
    expect(within(dialog).getByText("+2 laps")).toBeTruthy();
    expect(within(dialog).queryByText("+4.427")).toBeNull();

    await user.click(within(dialog).getByRole("tab", { name: "Sprint" }));
    expect(await within(dialog).findByText("No results for this session yet.")).toBeTruthy();

    await user.click(within(dialog).getByRole("tab", { name: "Qualifying" }));
    expect(await within(dialog).findByText("1:27.470")).toBeTruthy();

    expect(requestedPaths(fetchMock)).toEqual(
      expect.arrayContaining(["2026/2/results", "2026/2/sprint", "2026/2/qualifying"])
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(currentUrl).toBe("/lab/f1");
  });

  it("una carrera por disputar muestra el horario sin pedir resultados", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await raceButton("Miami Grand Prix"));
    const dialog = await screen.findByRole("dialog", { name: "Miami Grand Prix" });
    expect(within(dialog).getByText("This race hasn't happened yet.")).toBeTruthy();
    expect(within(dialog).getByText("Weekend schedule")).toBeTruthy();
    expect(requestedPaths(fetchMock).some((p) => p?.startsWith("2026/4/"))).toBe(false);
  });

  it("pilotos → temporada de un piloto → carrera, y Cerrar vuelve a la tabla", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("tab", { name: "Drivers" }));
    await user.click(await screen.findByRole("button", { name: "Open Lando Norris's season" }));

    const dialog = await screen.findByRole("dialog", { name: "Lando Norris" });
    expect(within(dialog).getByText(/P2 in the championship · 32.5 pts/)).toBeTruthy();
    const stats = await within(dialog).findByText("Podiums");
    expect(stats.nextElementSibling?.textContent).toBe("1");

    // Desde el piloto se abre una carrera: el modal cambia
    await user.click(within(dialog).getByRole("button", { name: "Chinese Grand Prix" }));
    expect(await screen.findByRole("dialog", { name: "Chinese Grand Prix" })).toBeTruthy();
    expect(currentUrl).toBe("/lab/f1?view=drivers&round=2");

    // Cerrar vuelve a la lista de una vez, no al piloto
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(currentUrl).toBe("/lab/f1?view=drivers");
  });

  it("constructores lista los pilotos de cada equipo", async () => {
    const user = userEvent.setup();
    renderApp("/lab/f1?view=constructors");

    const row = (await screen.findByRole("rowheader", { name: "Mercedes" })).closest("tr")!;
    expect(within(row).getByRole("button", { name: "Open Andrea Kimi Antonelli's season" })).toBeTruthy();
    expect(row.textContent).toContain("61");

    await user.click(within(row).getByRole("button", { name: /Antonelli/ }));
    expect(currentUrl).toBe("/lab/f1?view=constructors&driver=antonelli");
  });

  it("cambia de temporada y pide la nueva", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("NOR");

    await user.selectOptions(screen.getByLabelText("Season"), "2021");
    expect(currentUrl).toBe("/lab/f1?season=2021");
    await screen.findByText("NOR");
    expect(requestedPaths(fetchMock)).toEqual(expect.arrayContaining(["2021/races", "2021/results/1"]));
    expect(document.title).toBe("Pit Wall · F1 2021 | Jesus Figueroa");
  });

  it("ignora parámetros inválidos de la URL", async () => {
    renderApp("/lab/f1?season=1900&view=nope&driver=../x");
    expect(await screen.findByRole("tab", { name: "Races", selected: true })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    await screen.findByText("NOR");
    expect(requestedPaths(fetchMock).every((p) => p?.startsWith("2026/"))).toBe(true);
  });

  it("muestra el error y se recupera al reintentar", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError("offline")));
    renderApp("/lab/f1?view=drivers");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Can't reach the server");

    await user.click(within(alert).getByRole("button", { name: /Retry/ }));
    expect(await screen.findByRole("button", { name: "Open Lando Norris's season" })).toBeTruthy();
  });

  it("está en español si el idioma guardado es es", async () => {
    localStorage.setItem("lang", JSON.stringify("es"));
    renderApp();
    expect(await screen.findByRole("button", { name: /Próxima carrera.*Miami Grand Prix/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Pilotos" })).toBeTruthy();
  });
});
