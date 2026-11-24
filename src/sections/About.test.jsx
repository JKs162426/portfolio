// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LanguageProvider } from "../context/LanguageContext";
import content from "../data/content";
import { featured, more } from "../data/projects";
import About from "./About";

const projects = [...featured, ...more];

describe("<About />", () => {
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

  // Cada término y su valor, en el orden en que los lee un lector de pantalla
  function stats() {
    render(
      <LanguageProvider>
        <About />
      </LanguageProvider>
    );
    return screen.getAllByRole("term").map((dt) => [dt.textContent, spokenText(dt.nextElementSibling)]);
  }

  // Texto sin lo marcado aria-hidden (lo que no se lee en voz alta)
  function spokenText(node) {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    return copy.textContent;
  }

  it("las cifras salen de los datos de proyectos", () => {
    const clients = projects.filter((p) => p.badge === "client").length;
    expect(stats()).toEqual([
      ["Projects with demos", String(projects.length)],
      ["Real client in production", String(clients)],
      ["NASA Space Apps", "2026"],
      ["Bilingual", "Spanish and English"],
    ]);
  });

  it("está en español si el idioma guardado es es", () => {
    localStorage.setItem("lang", JSON.stringify("es"));
    expect(stats().map(([label]) => label)).toEqual([
      "Proyectos con demo", "Cliente real en producción", "NASA Space Apps", "Bilingüe",
    ]);
  });

  // "Cada uno con código y demo" tiene que seguir siendo cierto
  it("todos los proyectos tienen código y demo", () => {
    for (const p of projects) {
      expect(p.github, p.key).toBeTruthy();
      expect(p.live, p.key).toBeTruthy();
    }
  });

  it.each(["en", "es"])("cada tarjeta tiene etiqueta y detalle en %s", (lang) => {
    for (const key of ["projects", "clients", "hackathon", "languages"]) {
      const { label, detail } = content[lang].about.stats[key];
      expect(label && detail, `${lang}.about.stats.${key}`).toBeTruthy();
    }
  });
});
