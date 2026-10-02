// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import App from "./App";

function renderAt(path) {
  window.history.pushState({}, "", path);
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra la página 404 en rutas desconocidas", async () => {
    renderAt("/no-existe");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to the Lab" }).getAttribute("href")).toBe("/lab");
  });

  it("recuerda el idioma elegido y actualiza <html lang>", async () => {
    const user = userEvent.setup();
    renderAt("/no-existe");
    await user.click(screen.getByRole("button", { name: "ES" }));

    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("lang"))).toBe("es");
    expect(document.documentElement.lang).toBe("es");

    // Una visita nueva arranca en español
    cleanup();
    renderAt("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeTruthy();
  });

  it("ignora un idioma guardado inválido", async () => {
    localStorage.setItem("lang", JSON.stringify("fr"));
    renderAt("/no-existe");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
  });
});

describe("RouteErrorBoundary", () => {
  afterEach(cleanup);

  function Broken({ message }) {
    throw new Error(message);
  }

  function renderBroken(message) {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <LanguageProvider>
        <MemoryRouter>
          <RouteErrorBoundary>
            <Broken message={message} />
          </RouteErrorBoundary>
        </MemoryRouter>
      </LanguageProvider>
    );
  }

  it("pide recargar si falla la carga de un chunk tras un despliegue", () => {
    renderBroken("Failed to fetch dynamically imported module: /assets/FootballApp-abc.js");
    expect(screen.getByRole("heading", { name: "There's a new version" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });

  it("muestra un error genérico para otros fallos", () => {
    renderBroken("boom");
    expect(screen.getByRole("heading", { name: "Something broke" })).toBeTruthy();
  });
});
