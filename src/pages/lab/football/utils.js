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

// Apodos habituales que la API no incluye. Clave: id del equipo en
// football-data.org (las siglas se repiten entre ligas: FCB = Barça y Bayern)
const ALIASES = {
  // Premier League
  73: ["spurs"],
  66: ["man utd"],
  76: ["wolves"],
  351: ["forest"],
  397: ["seagulls"],
  563: ["hammers"],
  // LaLiga
  81: ["barcelona"],
  78: ["atletico de madrid"],
  77: ["athletic bilbao", "bilbao"],
  // Serie A
  108: ["inter milan"],
  109: ["juve"],
  // Bundesliga
  5: ["bayern munich"],
  18: ["gladbach"],
  // Ligue 1
  524: ["paris saint-germain"],
  516: ["olympique de marseille"],
};

// Ordena por relevancia: coincidencia exacta > empieza por > palabra > contiene
export function searchTeams(teams, query, limit = 6) {
  const q = normalizeText(query);
  if (!q) return [];

  const results = [];
  for (const team of teams) {
    const fields = [team.name, team.shortName, team.tla, ...(ALIASES[team.id] ?? [])].map(
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

// ---------- Copas: fases, grupos y eliminatorias ----------

const TABLE_STAGES = new Set(["REGULAR_SEASON", "LEAGUE_STAGE", "GROUP_STAGE"]);
const QUALIFYING_STAGE = /^(ROUND_\d+|QUALIFICATION|PRELIMINARY)/;

export function isKnockoutStage(stage) {
  return Boolean(stage) && !TABLE_STAGES.has(stage) && !QUALIFYING_STAGE.test(stage);
}

// Rondas eliminatorias en orden cronológico: [{ stage, matches }]
export function knockoutRounds(matches) {
  const rounds = new Map();
  for (const m of matches) {
    if (!isKnockoutStage(m.stage)) continue;
    if (!rounds.has(m.stage)) rounds.set(m.stage, []);
    rounds.get(m.stage).push(m);
  }
  return [...rounds.entries()]
    .map(([stage, list]) => ({
      stage,
      matches: list.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)),
    }))
    .sort((a, b) => new Date(a.matches[0].utcDate) - new Date(b.matches[0].utcDate));
}

// Clasificación de cada grupo calculada con los partidos terminados.
// Se usa cuando la API no da standings (Copa Libertadores). Desempate
// aproximado: puntos, diferencia de goles, goles a favor.
export function computeGroupTables(matches, stage = "GROUP_STAGE") {
  const groups = new Map();

  const rowFor = (group, team) => {
    if (!groups.has(group)) groups.set(group, new Map());
    const rows = groups.get(group);
    if (!rows.has(team.id)) {
      rows.set(team.id, { team, points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    return rows.get(team.id);
  };

  const tally = (row, scored, conceded) => {
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    if (scored > conceded) {
      row.won += 1;
      row.points += 3;
    } else if (scored === conceded) {
      row.draw += 1;
      row.points += 1;
    } else {
      row.lost += 1;
    }
  };

  for (const m of matches) {
    if (m.stage !== stage || !m.group || !m.homeTeam || !m.awayTeam) continue;
    const home = rowFor(m.group, m.homeTeam);
    const away = rowFor(m.group, m.awayTeam);
    if (statusGroup(m.status) !== "finished" || m.score.home == null) continue;
    tally(home, m.score.home, m.score.away);
    tally(away, m.score.away, m.score.home);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, rows]) => ({
      name,
      table: [...rows.values()]
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
            b.goalsFor - a.goalsFor ||
            a.team.name.localeCompare(b.team.name)
        )
        .map((row, i) => ({ ...row, position: i + 1 })),
    }));
}

// Resultado desde el punto de vista de un equipo: "won" | "draw" | "lost".
// Usa el ganador de la API, que tiene en cuenta prórroga y penales.
export function resultFor(match, teamId) {
  if (!teamId || statusGroup(match.status) !== "finished") return null;
  const { winner, home, away } = match.score;
  if (winner === "DRAW") return "draw";
  if (winner === "HOME_TEAM" || winner === "AWAY_TEAM") {
    const isHome = match.homeTeam?.id === teamId;
    return (winner === "HOME_TEAM") === isHome ? "won" : "lost";
  }
  if (home == null) return null;
  if (home === away) return "draw";
  return (home > away) === (match.homeTeam?.id === teamId) ? "won" : "lost";
}
