import { teamColor } from "../lib/teams";

// Barra con el color del equipo (decorativa: el nombre va siempre al lado)
export default function TeamMark({ teamId }: { teamId: string | undefined }) {
  return <span className="f1-team-mark" style={{ background: teamColor(teamId) }} aria-hidden="true" />;
}
