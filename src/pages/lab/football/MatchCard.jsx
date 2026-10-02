import { memo } from "react";
import { useFootball } from "./footballContext";
import { formatShortDate, formatTime } from "./format";
import { statusGroup } from "./utils";
import TeamCrest from "./TeamCrest";

// Resultado desde el punto de vista de un equipo: "won" | "draw" | "lost"
function resultFor(match, teamId) {
  const { home, away } = match.score;
  if (!teamId || statusGroup(match.status) !== "finished" || home == null) return null;
  if (home === away) return "draw";
  const isHome = match.homeTeam?.id === teamId;
  return (home > away) === isHome ? "won" : "lost";
}

export function StatusBadge({ match }) {
  const { t, locale } = useFootball();
  const group = statusGroup(match.status);
  const label =
    group === "upcoming"
      ? formatTime(match.utcDate, locale)
      : t.status[match.status] ?? t.status[group];

  return (
    <span className={`fb-status fb-status-${group}`}>
      {group === "live" && <span className="fb-live-dot" aria-hidden="true" />}
      {label}
    </span>
  );
}

function MatchCard({ match, onOpen, teamId, showDate = true }) {
  const { t, locale } = useFootball();
  const { homeTeam, awayTeam, score } = match;
  const hasScore = score.home != null && score.away != null;
  const result = resultFor(match, teamId);
  const homeName = homeTeam?.shortName ?? t.match.tbd;
  const awayName = awayTeam?.shortName ?? t.match.tbd;

  return (
    <li>
      <button
        type="button"
        className={`fb-match fb-match-${statusGroup(match.status)}`}
        onClick={() => onOpen(match.id)}
        aria-label={t.match.open(homeName, awayName)}
      >
        <span className="fb-match-meta">
          <StatusBadge match={match} />
          <span className="fb-match-date">
            {showDate && formatShortDate(match.utcDate, locale)}
            {match.matchday && (
              <>
                {showDate && " · "}
                {t.match.matchday(match.matchday)}
              </>
            )}
          </span>
          {result && (
            <span className={`fb-result fb-result-${result}`}>{t.table[result]}</span>
          )}
        </span>

        <span className="fb-match-teams">
          <span className={`fb-match-team home ${teamId === homeTeam?.id ? "focus" : ""}`}>
            <span className="fb-match-name">{homeName}</span>
            <TeamCrest team={homeTeam} />
          </span>
          <span className="fb-match-score">
            {hasScore ? (
              <>
                {score.home}
                <span className="fb-score-sep">–</span>
                {score.away}
              </>
            ) : (
              <span className="fb-score-vs">vs</span>
            )}
          </span>
          <span className={`fb-match-team away ${teamId === awayTeam?.id ? "focus" : ""}`}>
            <TeamCrest team={awayTeam} />
            <span className="fb-match-name">{awayName}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

export default memo(MatchCard);
