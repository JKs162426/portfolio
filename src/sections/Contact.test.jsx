// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LanguageProvider } from "../context/LanguageContext";
import Contact from "./Contact";

describe("<Contact />", () => {
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

  const renderContact = () =>
    render(
      <LanguageProvider>
        <Contact />
      </LanguageProvider>
    );

  it("dice qué busca y dónde está", () => {
    renderContact();
    expect(screen.getByText(/Looking for a full-stack developer role/)).toBeTruthy();
    expect(screen.getByText("Based in Orem, Utah")).toBeTruthy();
  });

  it("ofrece correo, LinkedIn, GitHub y el CV", () => {
    renderContact();
    const href = (name) => screen.getByRole("link", { name }).getAttribute("href");
    expect(href("↗ Email me")).toMatch(/^mailto:/);
    expect(href("↗ LinkedIn")).toBe("https://www.linkedin.com/in/jesusmfr93");
    expect(href("↗ GitHub")).toBe("https://github.com/JKs162426");
    expect(href("Download CV ↓")).toBe("/cv.pdf");
  });

  it("los enlaces externos abren en otra pestaña sin pasar la página de origen", () => {
    renderContact();
    for (const name of ["↗ LinkedIn", "↗ GitHub"]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }
  });
});
