// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, configure, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "../../../../context/LanguageContext";
import FootballApp from "../FootballApp";
import { rawMatches, rawStandings, rawStandingsPD } from "./fixtures.test-data.js";

// Margen para máquinas lentas o en frío: la búsqueda espera un debounce de
// 300 ms y el límite por defecto de findBy* (1 s) se quedaba justo
configure({ asyncUtilTimeout: 3000 });

const json = (body, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

// Simula el proxy /api/football según el recurso pedido
function apiMock(url) {
  const path = new URL(url, "http://localhost").searchParams.get("path");
  if (path === "competitions/PL/standings") return json(rawStandings);
  if (path === "competitions/PL/matches") return json(rawMatches);
  if (path === "competitions/PD/standings") return json(rawStandingsPD);
  if (path === "competitions/PD/matches") return json({ matches: [] });
  const match = rawMatches.matches.find((m) => `matches/${m.id}` === path);
  return match ? json(match) : json({ message: "not found" }, 404);
}

function renderApp(entry = "/lab/football") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/lab/football" element={<FootballApp />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );
}

describe("FootballApp", () => {
  let fetchMock;

  beforeEach(() => {
    // Solo se falsea la fecha ("hoy" = 2 oct 2026); los timers siguen reales
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    localStorage.clear();
    fetchMock = vi.fn(apiMock);
    vi.stubGlobal("fetch", fetchMock);
    // jsdom no implementa scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra la clasificación por defecto", async () => {
    renderApp();
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(5); // cabecera + 4 equipos
    expect(within(rows[1]).getByText("Liverpool")).toBeTruthy();
  });

  it("busca, selecciona un equipo y abre/cierra el detalle de un partido", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("table");

    await user.type(screen.getByRole("combobox"), "man");
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Manchester City FCMCI",
      "Manchester United FCMUN",
    ]);
    // La tabla también se filtra mientras se escribe
    expect(await screen.findByText("Showing 2 of 4 teams")).toBeTruthy();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(await screen.findByRole("heading", { name: "Manchester City FC" })).toBeTruthy();
    // Octubre 2026: Man City vs Liverpool (en vivo)
    const card = screen.getByRole("button", { name: /Man City vs Liverpool/ });
    expect(within(card).getByText("Live")).toBeTruthy();

    await user.click(card);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Manchester City FC")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    // Al cerrar se conserva la vista del equipo
    expect(screen.getByRole("heading", { name: "Manchester City FC" })).toBeTruthy();
  });

  it("cambia de mes y filtra por estado en la vista por equipo", async () => {
    const user = userEvent.setup();
    renderApp("/lab/football?view=team&team=57&month=2026-09");

    expect(await screen.findByRole("button", { name: /Arsenal vs Man City/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByRole("button", { name: /Man United vs Arsenal/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Full time" }));
    expect(screen.getByText("No matches with this status.")).toBeTruthy();
  });

  it("la vista por día salta al día con partidos más cercano", async () => {
    const user = userEvent.setup();
    renderApp("/lab/football?view=day");

    // Hoy (2 oct) no hay partidos → muestra el 4 oct
    expect(await screen.findByRole("button", { name: /Man City vs Liverpool/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next day with matches" }));
    expect(await screen.findByRole("button", { name: /Man United vs Arsenal/ })).toBeTruthy();
  });

  it("cambia de liga y descarta el equipo de la liga anterior", async () => {
    const user = userEvent.setup();
    renderApp("/lab/football?view=team&team=57");
    expect(await screen.findByRole("heading", { name: "Arsenal FC" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "LaLiga" }));
    expect(screen.getByRole("button", { name: "LaLiga" }).getAttribute("aria-pressed")).toBe("true");
    // El Arsenal no existe en LaLiga: se pide elegir equipo
    expect(await screen.findByText("Pick a team")).toBeTruthy();
    expect(screen.getByRole("combobox").getAttribute("placeholder")).toContain("Barça");

    await user.type(screen.getByRole("combobox"), "barca");
    expect((await screen.findAllByRole("option"))[0].textContent).toContain("FC Barcelona");
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("heading", { name: "FC Barcelona" })).toBeTruthy();
  });

  it("en el detalle, el marcador va en una sola fila", async () => {
    renderApp("/lab/football?match=1");
    const dialog = await screen.findByRole("dialog");
    const result = dialog.querySelector(".fb-scoreboard-result");
    expect(result.textContent).toBe("2–1");
  });

  it("refresca solo los partidos cada minuto si hay alguno en vivo", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    renderApp();
    await screen.findByRole("table");

    const matchCalls = () =>
      fetchMock.mock.calls.filter(([url]) => url.includes("PL%2Fmatches")).length;
    expect(matchCalls()).toBe(1);

    await act(() => vi.advanceTimersByTime(60_000));
    expect(matchCalls()).toBe(2);
  });

  it("muestra el error y se recupera al reintentar", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("offline")));
    renderApp();

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Can't reach the server/)).toBeTruthy();

    fetchMock.mockImplementation(apiMock);
    await user.click(within(alert).getByRole("button", { name: /Retry/ }));
    expect(await screen.findByRole("table")).toBeTruthy();
  });
});
