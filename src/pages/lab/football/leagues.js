// Ligas disponibles en el plan gratuito de football-data.org.
// Si añades una, añade también su código en api/_lib/footballProxy.js
// (la lista blanca del proxy) y su nombre en el README.
//
// zones: puestos marcados en la tabla. Son orientativos: los cupos europeos
// y el número de descensos pueden cambiar de una temporada a otra.

export const LEAGUES = [
  {
    code: "PL",
    emblem: "https://crests.football-data.org/PL.png",
    name: "Premier League",
    country: { en: "England", es: "Inglaterra" },
    examples: "Arsenal, Man City, LIV",
    zones: { top: 4, playoff: 0, bottom: 3 },
  },
  {
    code: "PD",
    emblem: "https://crests.football-data.org/laliga.png",
    name: "LaLiga",
    country: { en: "Spain", es: "España" },
    examples: "Barça, Real Madrid, ATL",
    zones: { top: 4, playoff: 0, bottom: 3 },
  },
  {
    code: "SA",
    emblem: "https://crests.football-data.org/c111.png",
    name: "Serie A",
    country: { en: "Italy", es: "Italia" },
    examples: "Inter, Juventus, NAP",
    zones: { top: 4, playoff: 0, bottom: 3 },
  },
  {
    code: "BL1",
    emblem: "https://crests.football-data.org/BL1.png",
    name: "Bundesliga",
    country: { en: "Germany", es: "Alemania" },
    examples: "Bayern, Dortmund, B04",
    zones: { top: 4, playoff: 1, bottom: 2 },
  },
  {
    code: "FL1",
    emblem: "https://crests.football-data.org/FL1.png",
    name: "Ligue 1",
    country: { en: "France", es: "Francia" },
    examples: "PSG, Marseille, LYO",
    zones: { top: 3, playoff: 1, bottom: 2 },
  },
];

export const DEFAULT_LEAGUE = "PL";

export function getLeague(code) {
  return LEAGUES.find((league) => league.code === code) ?? LEAGUES[0];
}

export function isLeagueCode(code) {
  return LEAGUES.some((league) => league.code === code);
}

// Zona de un puesto según la liga: "top" | "playoff" | "bottom" | null
export function zoneFor(league, position, tableSize) {
  const { top, playoff, bottom } = league.zones;
  if (position <= top) return "top";
  if (position > tableSize - bottom) return "bottom";
  if (playoff && position > tableSize - bottom - playoff) return "playoff";
  return null;
}
