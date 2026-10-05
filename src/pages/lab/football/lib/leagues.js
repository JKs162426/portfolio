// Competiciones disponibles en el plan gratuito de football-data.org.
// Si añades una, añade también su código en api/_lib/footballProxy.js
// (la lista blanca del proxy) y su nombre en el README.
//
// type: "LEAGUE" (liga regular) o "CUP" (copa con fases y eliminatorias).
// standings: false si la API no da clasificación (se calcula con los partidos).
// zones / groupZones: puestos marcados en la tabla general o en cada grupo.
//   Posiciones negativas cuentan desde abajo (-1 = último). `label` es la
//   clave del texto en content[lang].football.table.zones. Son orientativas:
//   los cupos pueden cambiar de una temporada a otra.
// stageAliases: renombra fases cuando la API usa un nombre genérico.

export const LEAGUES = [
  {
    code: "PL",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/PL.png",
    name: "Premier League",
    country: { en: "England", es: "Inglaterra" },
    examples: "Arsenal, Man City, LIV",
    zones: [
      { kind: "top", from: 1, to: 4, label: "ucl" },
      { kind: "bottom", from: -3, to: -1, label: "relegation" },
    ],
  },
  {
    code: "PD",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/laliga.png",
    name: "LaLiga",
    country: { en: "Spain", es: "España" },
    examples: "Barça, Real Madrid, ATL",
    zones: [
      { kind: "top", from: 1, to: 4, label: "ucl" },
      { kind: "bottom", from: -3, to: -1, label: "relegation" },
    ],
  },
  {
    code: "SA",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/c111.png",
    name: "Serie A",
    country: { en: "Italy", es: "Italia" },
    examples: "Inter, Juventus, NAP",
    zones: [
      { kind: "top", from: 1, to: 4, label: "ucl" },
      { kind: "bottom", from: -3, to: -1, label: "relegation" },
    ],
  },
  {
    code: "BL1",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/BL1.png",
    name: "Bundesliga",
    country: { en: "Germany", es: "Alemania" },
    examples: "Bayern, Dortmund, B04",
    zones: [
      { kind: "top", from: 1, to: 4, label: "ucl" },
      { kind: "playoff", from: -3, to: -3, label: "relegationPlayoff" },
      { kind: "bottom", from: -2, to: -1, label: "relegation" },
    ],
  },
  {
    code: "FL1",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/FL1.png",
    name: "Ligue 1",
    country: { en: "France", es: "Francia" },
    examples: "PSG, Marseille, LYO",
    zones: [
      { kind: "top", from: 1, to: 3, label: "ucl" },
      { kind: "playoff", from: -3, to: -3, label: "relegationPlayoff" },
      { kind: "bottom", from: -2, to: -1, label: "relegation" },
    ],
  },
  {
    code: "CL",
    type: "CUP",
    emblem: "https://crests.football-data.org/CL.png",
    name: "Champions League",
    country: { en: "Europe", es: "Europa" },
    examples: "Real Madrid, Bayern, PSG",
    // Fase liga de 36 equipos (formato desde 2024/25)
    zones: [
      { kind: "top", from: 1, to: 8, label: "r16" },
      { kind: "playoff", from: 9, to: 24, label: "koPlayoff" },
      { kind: "bottom", from: 25, to: -1, label: "eliminated" },
    ],
  },
  {
    code: "CLI",
    type: "CUP",
    standings: false,
    emblem: "https://crests.football-data.org/CLI.png",
    name: "Copa Libertadores",
    country: { en: "South America", es: "Sudamérica" },
    examples: "Flamengo, River Plate, Boca",
    groupZones: [
      { kind: "top", from: 1, to: 2, label: "advance" },
      { kind: "playoff", from: 3, to: 3, label: "toSudamericana" },
    ],
    // En la Libertadores, la ronda posterior a los grupos son los octavos
    stageAliases: { PLAY_OFFS: "LAST_16" },
  },
];

export const DEFAULT_LEAGUE = "PL";

export function getLeague(code) {
  return LEAGUES.find((league) => league.code === code) ?? LEAGUES[0];
}

export function isLeagueCode(code) {
  return LEAGUES.some((league) => league.code === code);
}

// Zona de un puesto en una tabla de `size` equipos, o null
export function zoneFor(zones, position, size) {
  if (!zones) return null;
  const resolve = (n) => (n < 0 ? size + n + 1 : n);
  return zones.find((z) => position >= resolve(z.from) && position <= resolve(z.to)) ?? null;
}
