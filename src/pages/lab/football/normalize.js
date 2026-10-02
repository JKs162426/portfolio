// Convierte las respuestas de football-data.org (v4) a una forma estable.
// Todo es defensivo: el plan gratuito omite campos y algunos partidos
// llegan incompletos (equipos por confirmar, sin marcador, etc.).

export function normalizeTeam(team) {
  if (!team || team.id == null) return null;
  return {
    id: team.id,
    name: team.name ?? team.shortName ?? "—",
    shortName: team.shortName ?? team.name ?? "—",
    tla: team.tla ?? "",
    crest: team.crest ?? null,
  };
}

export function normalizeStandings(raw) {
  const total =
    raw?.standings?.find((group) => group.type === "TOTAL") ??
    raw?.standings?.[0];

  const table = (total?.table ?? [])
    .map((row) => ({
      position: row.position,
      team: normalizeTeam(row.team),
      points: row.points ?? 0,
      played: row.playedGames ?? 0,
      won: row.won ?? 0,
      draw: row.draw ?? 0,
      lost: row.lost ?? 0,
      goalsFor: row.goalsFor ?? 0,
      goalsAgainst: row.goalsAgainst ?? 0,
    }))
    .filter((row) => row.team);

  return {
    season: {
      startDate: raw?.season?.startDate ?? null,
      endDate: raw?.season?.endDate ?? null,
      currentMatchday: raw?.season?.currentMatchday ?? null,
    },
    table,
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

export function normalizeMatch(raw) {
  const referee =
    raw.referees?.find((r) => r.type === "REFEREE") ?? raw.referees?.[0];

  return {
    id: raw.id,
    utcDate: raw.utcDate,
    status: raw.status,
    matchday: raw.matchday ?? null,
    homeTeam: normalizeTeam(raw.homeTeam),
    awayTeam: normalizeTeam(raw.awayTeam),
    score: {
      home: raw.score?.fullTime?.home ?? null,
      away: raw.score?.fullTime?.away ?? null,
      halfHome: raw.score?.halfTime?.home ?? null,
      halfAway: raw.score?.halfTime?.away ?? null,
      winner: raw.score?.winner ?? null,
    },
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
