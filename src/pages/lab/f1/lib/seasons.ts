// Temporadas disponibles. MIN_SEASON debe coincidir con api/f1.ts (lo comprueba api/f1.test.ts)
export const MIN_SEASON = 1950;

export function currentSeason(now = new Date()): number {
  return now.getUTCFullYear();
}

export function isValidSeason(value: unknown, now = new Date()): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_SEASON &&
    value <= currentSeason(now)
  );
}

/** "2026" → 2026; cualquier otra cosa → temporada actual */
export function parseSeason(raw: string | null, now = new Date()): number {
  const season = Number(raw);
  return isValidSeason(season, now) ? season : currentSeason(now);
}

/** Temporadas de la más reciente a la más antigua */
export function seasonOptions(now = new Date()): number[] {
  const seasons: number[] = [];
  for (let year = currentSeason(now); year >= MIN_SEASON; year--) seasons.push(year);
  return seasons;
}

export function isPastSeason(season: number, now = new Date()): boolean {
  return season < currentSeason(now);
}
