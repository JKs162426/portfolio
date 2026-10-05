import { dateKeyToDate, isKnockoutStage, monthKeyToDate } from "./utils";

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

// ---------- Fases de copa ----------

// "QUARTER_FINALS" → "Quarter-finals" (con alias por competición)
export function stageName(stage, t, league) {
  const key = league?.stageAliases?.[stage] ?? stage;
  return t.stages[key] ?? (key ? key.replaceAll("_", " ").toLowerCase() : "");
}

// "GROUP_C" → "Group C"
export function groupName(group, t) {
  const match = /^GROUP_([A-Z0-9]+)$/.exec(group ?? "");
  return match ? t.group(match[1]) : group;
}

// Contexto corto de un partido: "Matchday 5", "Group C · Matchday 3", "Semi-finals"
export function matchContext(match, t, league) {
  if (isKnockoutStage(match.stage) || /^ROUND_/.test(match.stage ?? "")) {
    return stageName(match.stage, t, league);
  }
  const parts = [];
  if (match.group) parts.push(groupName(match.group, t));
  if (match.matchday) parts.push(t.match.matchday(match.matchday));
  return parts.join(" · ");
}

// Complemento del marcador: "5–3 pen." o "AET"
export function scoreNote(score, t) {
  if (score.penHome != null) return `${score.penHome}–${score.penAway} ${t.match.penalties}`;
  if (score.duration === "EXTRA_TIME") return t.match.extraTime;
  return null;
}
