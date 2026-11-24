import type { Messages } from "../i18n";
import { F1ApiError } from "./api";
import type { Finish } from "./types";

/** "Sun, Mar 8" · con año si se pide */
export function formatDate(iso: string, locale: string, { year = false } = {}): string {
  // Solo fecha: se interpreta en UTC para que no cambie de día según la zona
  const dateOnly = !iso.includes("T");
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(new Date(dateOnly ? `${iso}T00:00:00Z` : iso));
}

export function formatTime(value: string | number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatPoints(points: number, locale: string): string {
  // Hay medios puntos (carreras acortadas): 0.5, 12.5…
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(points);
}

export function finishLabel(finish: Finish, t: Messages): string {
  return finish.classified ? String(finish.position) : t.finish[finish.code] ?? finish.code;
}

export function errorMessage(t: Messages, error: unknown): string {
  if (!(error instanceof F1ApiError)) return t.errors.server;
  if (error.kind === "rate_limit") return t.errors.rate_limit(error.retryAfter ?? 60);
  return t.errors[error.kind];
}
