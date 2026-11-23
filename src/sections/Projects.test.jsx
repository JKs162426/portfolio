// @vitest-environment jsdom
import fs from "node:fs";
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
  it.each(["en", "es"])("cada proyecto tiene puntos y etiqueta en %s", (lang) => {
    const t = content[lang].projects;
    for (const project of all) {
      const points = t.impact[project.key];
      expect(points?.length, `${lang}.impact.${project.key}`).toBeGreaterThan(0);
      for (const { label, text } of points) {
        expect(label && text, `${lang}.impact.${project.key}: ${label}`).toBeTruthy();
        // El separador lo pone el componente
        expect(label, `${lang}.impact.${project.key}`).not.toMatch(/·/);
      }
      // Las etiquetas son la key de React: no pueden repetirse en una tarjeta
      expect(new Set(points.map((p) => p.label)).size).toBe(points.length);
      if (project.badge) expect(t.badges[project.badge], `${lang}.badges.${project.badge}`).toBeTruthy();
    }
  });

  it("los dos idiomas tienen los mismos puntos por proyecto", () => {
    for (const project of all) {
      expect(content.es.projects.impact[project.key].length, project.key).toBe(
        content.en.projects.impact[project.key].length
      );
    }
  });

  it("no sobran puntos de proyectos que ya no existen", () => {
    const keys = all.map((p) => p.key).sort();
    expect(Object.keys(content.en.projects.impact).sort()).toEqual(keys);
    expect(Object.keys(content.es.projects.impact).sort()).toEqual(keys);
  });

  // Una captura que falta se ve como un hueco roto en la tarjeta
  it("cada proyecto tiene su captura en public/projects", () => {
    for (const project of all) {
      expect(fs.existsSync(`public/projects/${project.key}.webp`), project.key).toBe(true);
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
      "Lunar Landing Site Navigator", "GymLog", "Sacrament Meeting Program",
    ]);
  });

  it("marca el tipo de cada proyecto", () => {
    renderProjects();
    const card = (title) => screen.getByRole("heading", { name: title }).closest("article");
    // Solo la insignia: en GymLog un punto de la tarjeta repite "Team project"
    const badge = { selector: ".project-badge" };
    expect(within(card("Detalles DanKar")).getByText("Real client", badge)).toBeTruthy();
    expect(within(card("Accanto")).getByText("Concept project", badge)).toBeTruthy();
    expect(within(card("GymLog")).getByText("Team project", badge)).toBeTruthy();
    expect(within(card("Lunar Landing Site Navigator")).getByText("NASA Space Apps", badge)).toBeTruthy();
    expect(card("Matchday").querySelector(".project-badge")).toBeNull();
  });

  it("muestra los puntos de cada tarjeta con el separador oculto a lectores de pantalla", () => {
    renderProjects();
    const card = screen.getByRole("heading", { name: "Detalles DanKar" }).closest("article");
    const items = card.querySelectorAll(".project-impact-item");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toMatch(/^Need · Help a handmade/);
    expect(items[0].querySelector('[aria-hidden="true"]').textContent).toBe(" · ");
  });

  it("cada tarjeta muestra su captura, con carga diferida y texto alternativo", () => {
    renderProjects();
    const card = screen.getByRole("heading", { name: "Lunar Landing Site Navigator" }).closest("article");
    const img = within(card).getByRole("img", { name: "Screenshot of Lunar Landing Site Navigator" });
    expect(img.getAttribute("src")).toBe("/projects/lunar.webp");
    expect(img.getAttribute("loading")).toBe("lazy");
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
