// ---------- Estados de partido ----------

export const STATUS_FILTERS = ["all", "live", "upcoming", "finished"];

const STATUS_GROUPS = {
  IN_PLAY: "live",
  PAUSED: "live",
  LIVE: "live",
  FINISHED: "finished",
  AWARDED: "finished",
  SCHEDULED: "upcoming",
  TIMED: "upcoming",
};

// POSTPONED, SUSPENDED, CANCELLED… quedan como "other"
export function statusGroup(status) {
  return STATUS_GROUPS[status] ?? "other";
}

// ---------- Fechas (siempre en hora local del usuario) ----------

const pad = (n) => String(n).padStart(2, "0");

export function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toMonthKey(date) {
  return toDateKey(date).slice(0, 7);
}

export function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d;
}

export function isMonthKey(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "");
}

export function dateKeyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthKeyToDate(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function shiftMonth(key, delta) {
  const date = monthKeyToDate(key);
  return toMonthKey(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

// ---------- Búsqueda ----------

export function normalizeText(text) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Apodos habituales que la API no incluye (clave: siglas del equipo)
const ALIASES = {
  TOT: ["spurs"],
  MUN: ["man utd"],
  WOL: ["wolves"],
  NOT: ["forest"],
  NFO: ["forest"],
  BHA: ["seagulls"],
  WHU: ["hammers"],
};

// Ordena por relevancia: coincidencia exacta > empieza por > palabra > contiene
export function searchTeams(teams, query, limit = 6) {
  const q = normalizeText(query);
  if (!q) return [];

  const results = [];
  for (const team of teams) {
    const fields = [team.name, team.shortName, team.tla, ...(ALIASES[team.tla] ?? [])].map(
      normalizeText
    );
    let score = -1;
    if (fields.some((f) => f === q)) score = 0;
    else if (fields.some((f) => f.startsWith(q))) score = 1;
    else if (fields.some((f) => f.split(/\s+/).some((w) => w.startsWith(q)))) score = 2;
    else if (fields.some((f) => f.includes(q))) score = 3;
    if (score >= 0) results.push({ team, score });
  }

  return results
    .sort((a, b) => a.score - b.score || a.team.name.localeCompare(b.team.name))
    .slice(0, limit)
    .map((r) => r.team);
}

// ---------- Filtros de partidos ----------

export function involvesTeam(match, teamId) {
  return match.homeTeam?.id === teamId || match.awayTeam?.id === teamId;
}

export function filterMatches(matches, { teamId, monthKey, dateKey, status = "all" } = {}) {
  return matches
    .filter(
      (m) =>
        (!teamId || involvesTeam(m, teamId)) &&
        (!monthKey || toMonthKey(m.utcDate) === monthKey) &&
        (!dateKey || toDateKey(m.utcDate) === dateKey) &&
        (status === "all" || statusGroup(m.status) === status)
    )
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
}

// Días (ordenados) en los que hay al menos un partido
export function matchDates(matches) {
  return [...new Set(matches.map((m) => toDateKey(m.utcDate)))].sort();
}

// direction: 1 → siguiente día con partidos, -1 → anterior,
// 0 → el mismo día si tiene partidos, si no el siguiente (o el último)
export function nearestMatchDate(dates, fromKey, direction = 0) {
  if (dates.length === 0) return null;
  if (direction < 0) return dates.filter((d) => d < fromKey).at(-1) ?? null;
  if (direction > 0) return dates.find((d) => d > fromKey) ?? null;
  return dates.find((d) => d >= fromKey) ?? dates.at(-1);
}

export function seasonMonthRange(matches) {
  if (matches.length === 0) return null;
  const months = matches.map((m) => toMonthKey(m.utcDate)).sort();
  return { first: months[0], last: months.at(-1) };
}

export function clampMonth(key, range) {
  if (!range) return key;
  if (key < range.first) return range.first;
  if (key > range.last) return range.last;
  return key;
}

// ---------- Paginación y orden ----------

export function paginate(items, page, size) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page || 1), pageCount);
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current,
    pageCount,
  };
}

export function sortTable(rows, key, direction) {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const diff =
      key === "team"
        ? a.team.name.localeCompare(b.team.name)
        : a[key] - b[key];
    // En empate se respeta la posición oficial
    return factor * diff || a.position - b.position;
  });
}
