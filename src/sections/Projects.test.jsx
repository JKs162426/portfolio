// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext";
import content from "../data/content";
import { featured, more } from "../data/projects";
import Projects from "./Projects";

describe("datos de proyectos", () => {
  const all = [...featured, ...more];

  // Un texto que falta no rompe nada: la tarjeta sale con un hueco sin avisar
  it.each(["en", "es"])("cada proyecto tiene descripción y etiqueta en %s", (lang) => {
    const t = content[lang].projects;
    for (const project of all) {
      expect(t.items[project.key], `${lang}.items.${project.key}`).toBeTruthy();
      if (project.badge) expect(t.badges[project.badge], `${lang}.badges.${project.badge}`).toBeTruthy();
    }
  });

  it("no repite claves ni títulos", () => {
    expect(new Set(all.map((p) => p.key)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.title)).size).toBe(all.length);
  });
});

describe("<Projects />", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function renderProjects() {
    return render(
      <LanguageProvider>
        <MemoryRouter>
          <Projects />
        </MemoryRouter>
      </LanguageProvider>
    );
  }

  it("muestra los destacados en orden y luego los demás", () => {
    renderProjects();
    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "Detalles DanKar", "Accanto", "Matchday", "Glossia",
      "More projects",
      "GymLog", "Sacrament Meeting Program",
    ]);
  });

  it("marca el tipo de cada proyecto", () => {
    renderProjects();
    const card = (title) => screen.getByRole("heading", { name: title }).closest("article");
    expect(within(card("Detalles DanKar")).getByText("Real client")).toBeTruthy();
    expect(within(card("Accanto")).getByText("Concept project")).toBeTruthy();
    expect(within(card("GymLog")).getByText("Team project")).toBeTruthy();
    expect(within(card("Matchday")).queryByText(/client|concept|team/i)).toBeNull();
  });

  it("Matchday enlaza dentro del sitio y el resto abre en otra pestaña", () => {
    renderProjects();
    const live = (title) =>
      within(screen.getByRole("heading", { name: title }).closest("article")).getByRole("link", { name: "↗ Live" });
    expect(live("Matchday").getAttribute("href")).toBe("/lab/football");
    expect(live("Matchday").getAttribute("target")).toBeNull();
    expect(live("Accanto").getAttribute("target")).toBe("_blank");
    expect(live("Accanto").getAttribute("rel")).toBe("noreferrer");
  });
});
