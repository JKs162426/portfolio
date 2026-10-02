import { dateKeyToDate, monthKeyToDate } from "./utils";

export function formatTime(date, locale) {
  return new Date(date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatShortDate(date, locale) {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(date, locale) {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDayKey(key, locale) {
  return formatLongDate(dateKeyToDate(key), locale);
}

// Texto traducido para un FootballApiError (u otro error inesperado)
export function errorMessage(t, error) {
  const message = t.errors[error?.kind] ?? t.errors.server;
  return typeof message === "function" ? message(error.retryAfter ?? 60) : message;
}

export function formatMonthKey(key, locale) {
  return monthKeyToDate(key).toLocaleDateString(locale, { month: "long", year: "numeric" });
}
