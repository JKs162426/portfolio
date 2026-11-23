// @vitest-environment jsdom
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../../context/LanguageContext";
import caseStudies from "../../data/caseStudies";
import { featured, more } from "../../data/projects";
import CaseStudy from "./CaseStudy";

const withCaseStudy = [...featured, ...more].filter((p) => p.caseStudy);

function renderCase(key = "dankar") {
  return render(
    <LanguageProvider>
      <MemoryRouter>
        <CaseStudy projectKey={key} />
      </MemoryRouter>
    </LanguageProvider>
  );
}

describe("datos de los casos de estudio", () => {
  // Un caso nuevo necesita varias piezas; si falta una, la página da 404 en producción
  it.each(withCaseStudy.map((p) => [p.key, p]))("%s tiene textos, ruta, rewrite, sitemap y captura", (key, p) => {
    expect(caseStudies.en[key], `en.${key}`).toBeTruthy();
    expect(caseStudies.es[key], `es.${key}`).toBeTruthy();
    expect(fs.readFileSync("src/App.jsx", "utf8")).toContain(`<Route path="${p.caseStudy}"`);
    const rewrites = JSON.parse(fs.readFileSync("vercel.json", "utf8")).rewrites.map((r) => r.source);
    expect(rewrites).toContain(p.caseStudy);
    expect(fs.readFileSync("public/sitemap.xml", "utf8")).toContain(`https://jfigueroa.dev${p.caseStudy}<`);
    expect(fs.existsSync(`public/projects/${key}-case.webp`)).toBe(true);
  });

  it("los dos idiomas tienen las mismas secciones y puntos", () => {
    for (const { key } of withCaseStudy) {
      const shape = (study) => study.sections.map((s) => [s.paragraphs?.length ?? 0, s.items?.length ?? 0]);
      expect(shape(caseStudies.es[key]), key).toEqual(shape(caseStudies.en[key]));
      expect(caseStudies.es[key].facts.length, key).toBe(caseStudies.en[key].facts.length);
    }
  });
});

describe("<CaseStudy />", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("muestra el proyecto con una sola h1, sus datos y sus secciones", () => {
    renderCase();
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["Detalles DanKar."]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "The brief", "Key decisions", "Trade-offs and lessons",
    ]);
    expect(screen.getByText("In production")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Detalles DanKar home page" }).getAttribute("src")).toBe(
      "/projects/dankar-case.webp"
    );
    expect(document.title).toBe("Detalles DanKar · case study | Jesus Figueroa");
  });

  it("enlaza a la tienda y al código en otra pestaña, y vuelve a la lista de proyectos", () => {
    renderCase();
    const live = screen.getByRole("link", { name: "↗ Visit the live site" });
    expect(live.getAttribute("href")).toBe("https://dankar.vercel.app");
    expect(live.getAttribute("rel")).toBe("noreferrer");
    expect(screen.getByRole("link", { name: "↗ Read the code" }).getAttribute("target")).toBe("_blank");
    for (const back of screen.getAllByRole("link", { name: "← All projects" })) {
      expect(back.getAttribute("href")).toBe("/#projects");
    }
  });

  it("no muestra testimonio mientras no haya uno real", () => {
    renderCase();
    expect(screen.queryByRole("blockquote")).toBeNull();
    expect(document.querySelector(".case-quote")).toBeNull();
  });

  it("está en español si el idioma guardado es es", () => {
    localStorage.setItem("lang", JSON.stringify("es"));
    renderCase();
    expect(screen.getByRole("heading", { level: 2, name: "Decisiones clave" })).toBeTruthy();
    const decisions = screen.getByRole("heading", { name: "Decisiones clave" }).closest("section");
    expect(within(decisions).getAllByRole("listitem")).toHaveLength(4);
  });
});
