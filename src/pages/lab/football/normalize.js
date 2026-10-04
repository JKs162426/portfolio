// Convierte las respuestas de football-data.org (v4) a una forma estable.
// Todo es defensivo: el plan gratuito omite campos y algunos partidos
// llegan incompletos (equipos por confirmar, sin marcador, etc.).

export function normalizeTeam(team) {
  if (!team || team.id == null) return null;
  return {
    id: team.id,
    name: team.name ?? team.shortName ?? "—",
    shortName: team.shortName ?? team.name ?? "—",
    // Algunas siglas llegan con espacios (p. ej. Estrasburgo: "RC ")
    tla: team.tla?.trim() ?? "",
    crest: team.crest ?? null,
  };
}

function normalizeRow(row) {
  return {
    position: row.position,
    team: normalizeTeam(row.team),
    points: row.points ?? 0,
    played: row.playedGames ?? 0,
    won: row.won ?? 0,
    draw: row.draw ?? 0,
    lost: row.lost ?? 0,
    goalsFor: row.goalsFor ?? 0,
    goalsAgainst: row.goalsAgainst ?? 0,
  };
}

// Las ligas traen una tabla TOTAL; las copas, una por grupo (o la fase liga
// de la Champions). `table` es la primera, `groups` todas.
export function normalizeStandings(raw) {
  const totals = (raw?.standings ?? []).filter((group) => group.type === "TOTAL");
  const source = totals.length ? totals : (raw?.standings ?? []).slice(0, 1);

  const groups = source
    .map((group) => ({
      name: group.group ?? null,
      table: (group.table ?? []).map(normalizeRow).filter((row) => row.team),
    }))
    .filter((group) => group.table.length > 0);

  return {
    season: {
      startDate: raw?.season?.startDate ?? null,
      endDate: raw?.season?.endDate ?? null,
      currentMatchday: raw?.season?.currentMatchday ?? null,
    },
    table: groups[0]?.table ?? [],
    groups,
  };
}

function normalizeSide(side) {
  if (!side) return null;
  return {
    formation: side.formation ?? null,
    coach: side.coach?.name ?? null,
    lineup: (side.lineup ?? []).map(normalizePlayer),
    bench: (side.bench ?? []).map(normalizePlayer),
    statistics: side.statistics ?? null,
  };
}

function normalizePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position ?? null,
    shirtNumber: player.shirtNumber ?? null,
  };
}

// En partidos decididos por penales, fullTime de la API SUMA los goles de la
// tanda (1–0 y 5–3 en penales llega como 6–3). Se separan para mostrar
// "1–0 · 5–3 pen." en lugar de un marcador que nunca existió.
export function normalizeScore(score) {
  const full = score?.fullTime ?? {};
  const pens = score?.penalties ?? null;
  const shootout = score?.duration === "PENALTY_SHOOTOUT" && pens?.home != null;
  const minus = (total, p) => (total == null ? null : total - (shootout ? p ?? 0 : 0));

  return {
    home: minus(full.home, pens?.home),
    away: minus(full.away, pens?.away),
    halfHome: score?.halfTime?.home ?? null,
    halfAway: score?.halfTime?.away ?? null,
    penHome: shootout ? pens.home : null,
    penAway: shootout ? pens.away : null,
    duration: score?.duration ?? "REGULAR", // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
    winner: score?.winner ?? null, // HOME_TEAM | AWAY_TEAM | DRAW
  };
}

export function normalizeMatch(raw) {
  const referee =
    raw.referees?.find((r) => r.type === "REFEREE") ?? raw.referees?.[0];

  return {
    id: raw.id,
    utcDate: raw.utcDate,
    status: raw.status,
    matchday: raw.matchday ?? null,
    stage: raw.stage ?? null,
    group: raw.group ?? null,
    homeTeam: normalizeTeam(raw.homeTeam),
    awayTeam: normalizeTeam(raw.awayTeam),
    score: normalizeScore(raw.score),
    venue: raw.venue ?? null,
    referee: referee?.name ?? null,
  };
}

export function normalizeMatches(raw) {
  return (raw?.matches ?? [])
    .filter((match) => match?.id != null && match.utcDate)
    .map(normalizeMatch);
}

// El detalle añade goles, alineaciones y estadísticas cuando el plan los incluye
export function normalizeMatchDetail(raw) {
  return {
    ...normalizeMatch(raw),
    attendance: raw.attendance ?? null,
    goals: (raw.goals ?? []).map((goal) => ({
      minute: goal.minute ?? null,
      injuryTime: goal.injuryTime ?? null,
      type: goal.type ?? "REGULAR",
      teamId: goal.team?.id ?? null,
      scorer: goal.scorer?.name ?? null,
      assist: goal.assist?.name ?? null,
    })),
    home: normalizeSide(raw.homeTeam),
    away: normalizeSide(raw.awayTeam),
  };
}
