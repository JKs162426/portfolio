// Color de cada equipo de la parrilla 2026 (librea aproximada). Los equipos
// históricos no tienen color: se usa uno neutro.
const TEAM_COLORS: Record<string, string> = {
  mercedes: "#27f4d2",
  ferrari: "#e8002d",
  red_bull: "#3671c6",
  mclaren: "#ff8000",
  rb: "#6692ff",
  alpine: "#ff87bc",
  haas: "#b6babd",
  audi: "#c1272d",
  sauber: "#52e252",
  williams: "#64c4ff",
  aston_martin: "#229971",
  cadillac: "#c9a227",
};

export const NEUTRAL_TEAM_COLOR = "#556372";

export function teamColor(teamId: string | undefined): string {
  return (teamId && TEAM_COLORS[teamId]) || NEUTRAL_TEAM_COLOR;
}
