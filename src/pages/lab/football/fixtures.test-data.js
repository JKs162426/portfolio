// Respuestas de ejemplo con la forma de football-data.org v4 (recortadas)

export const ARS = { id: 57, name: "Arsenal FC", shortName: "Arsenal", tla: "ARS", crest: "ars.png" };
export const MCI = { id: 65, name: "Manchester City FC", shortName: "Man City", tla: "MCI", crest: "mci.png" };
export const MUN = { id: 66, name: "Manchester United FC", shortName: "Man United", tla: "MUN", crest: "mun.png" };
export const LIV = { id: 64, name: "Liverpool FC", shortName: "Liverpool", tla: "LIV", crest: "liv.png" };

export const rawStandings = {
  season: { startDate: "2026-08-15", endDate: "2027-05-23", currentMatchday: 7 },
  standings: [
    { type: "HOME", table: [] },
    {
      type: "TOTAL",
      table: [
        { position: 1, team: LIV, playedGames: 7, won: 6, draw: 1, lost: 0, points: 19, goalsFor: 15, goalsAgainst: 4 },
        { position: 2, team: ARS, playedGames: 7, won: 5, draw: 1, lost: 1, points: 16, goalsFor: 12, goalsAgainst: 5 },
        { position: 3, team: MCI, playedGames: 7, won: 5, draw: 0, lost: 2, points: 15, goalsFor: 14, goalsAgainst: 8 },
        { position: 4, team: MUN, playedGames: 7, won: 3, draw: 1, lost: 3, points: 10, goalsFor: 9, goalsAgainst: 10 },
      ],
    },
  ],
};

function rawMatch(id, utcDate, status, home, away, fullTime = { home: null, away: null }) {
  return {
    id,
    utcDate,
    status,
    matchday: 1,
    homeTeam: home,
    awayTeam: away,
    score: { winner: null, fullTime, halfTime: { home: null, away: null } },
    referees: [{ id: 1, name: "Michael Oliver", type: "REFEREE" }],
  };
}

export const rawMatches = {
  matches: [
    rawMatch(1, "2026-09-20T14:00:00Z", "FINISHED", ARS, MCI, { home: 2, away: 1 }),
    rawMatch(2, "2026-09-20T16:30:00Z", "FINISHED", LIV, MUN, { home: 1, away: 1 }),
    rawMatch(3, "2026-10-04T14:00:00Z", "IN_PLAY", MCI, LIV, { home: 0, away: 0 }),
    rawMatch(4, "2026-10-18T14:00:00Z", "TIMED", MUN, ARS),
    rawMatch(5, "2026-11-01T15:00:00Z", "POSTPONED", ARS, LIV),
    { id: 6, status: "TIMED" }, // incompleto: sin fecha → se descarta
  ],
};
