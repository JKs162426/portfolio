import { useEffect, useId, useMemo, useRef } from "react";
import { useFootball } from "./footballContext";
import { useFootballData } from "../../../hooks/useFootballData";
import { matchResource } from "./api";
import { formatLongDate, formatTime, matchContext, scoreNote } from "./format";
import { statusGroup } from "./utils";
import { StatusBadge } from "./MatchCard";
import { ErrorState, SkeletonList } from "./States";
import TeamCrest from "./TeamCrest";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Modal accesible: Esc cierra, el foco queda atrapado dentro y vuelve
// al elemento que lo abrió al cerrar
function useModalBehaviour(dialogRef, onClose) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector(FOCUSABLE)?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled);
      if (items.length === 0) return;
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [dialogRef]);
}

function Goals({ match, t }) {
  if (match.goals.length === 0) {
    return statusGroup(match.status) === "upcoming" ? null : (
      <p className="fb-detail-muted">{t.match.noGoals}</p>
    );
  }

  return (
    <ul className="fb-goals">
      {match.goals.map((goal, i) => {
        const side = goal.teamId === match.awayTeam?.id ? "away" : "home";
        const minute = goal.injuryTime ? `${goal.minute}+${goal.injuryTime}` : goal.minute;
        return (
          <li key={i} className={`fb-goal ${side}`}>
            <span className="fb-goal-minute">{minute}'</span>
            <span>
              {goal.scorer ?? "—"}
              {goal.type === "OWN" && <em> ({t.match.ownGoal})</em>}
              {goal.type === "PENALTY" && <em> ({t.match.penalty})</em>}
              {goal.assist && (
                <span className="fb-detail-muted"> · {t.match.assist}: {goal.assist}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Lineup({ team, side, t }) {
  if (!side?.lineup.length) return null;
  return (
    <div className="fb-lineup">
      <h4>
        {team?.shortName}
        {side.formation && <span className="fb-detail-muted"> · {side.formation}</span>}
      </h4>
      <ol>
        {side.lineup.map((p) => (
          <li key={p.id}>
            <span className="fb-shirt">{p.shirtNumber ?? ""}</span>
            {p.name}
          </li>
        ))}
      </ol>
      {side.bench.length > 0 && (
        <>
          <h5>{t.match.bench}</h5>
          <p className="fb-detail-muted">{side.bench.map((p) => p.name).join(", ")}</p>
        </>
      )}
      {side.coach && (
        <p className="fb-detail-muted">
          {t.match.coach}: {side.coach}
        </p>
      )}
    </div>
  );
}

function Statistics({ match, t }) {
  const home = match.home?.statistics;
  const away = match.away?.statistics;
  if (!home || !away) return null;
  const keys = Object.keys(t.match.statLabels).filter((k) => home[k] != null && away[k] != null);
  if (keys.length === 0) return null;

  return (
    <section className="fb-detail-section">
      <h3>{t.match.stats}</h3>
      <dl className="fb-stats">
        {keys.map((key) => {
          const total = Number(home[key]) + Number(away[key]) || 1;
          return (
            <div key={key} className="fb-stat">
              <dt>{t.match.statLabels[key]}</dt>
              <dd>
                <span>{home[key]}</span>
                <span className="fb-stat-bar" aria-hidden="true">
                  <span style={{ width: `${(Number(home[key]) / total) * 100}%` }} />
                </span>
                <span>{away[key]}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export default function MatchDetails({ matchId, onClose }) {
  const { t, locale, matchesById, league } = useFootball();
  const dialogRef = useRef(null);
  const titleId = useId();
  useModalBehaviour(dialogRef, onClose);

  const resource = useMemo(() => matchResource(matchId), [matchId]);
  const detail = useFootballData(resource);
  // El resumen de la lista manda en marcador y estado (se refresca solo con
  // partidos en vivo); el detalle aporta lo extra. Mientras llega, basta el resumen.
  const summary = matchesById.get(matchId);
  const match = summary ? { ...detail.data, ...summary } : detail.data;

  const hasExtra =
    detail.data &&
    (detail.data.goals.length > 0 || detail.data.home?.lineup.length || detail.data.home?.statistics);
  const played = match && statusGroup(match.status) !== "upcoming";

  return (
    <div
      className="fb-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className="fb-modal-top">
          <h2 id={titleId} className="fb-modal-label">
            {t.match.details}
          </h2>
          <button type="button" className="fb-icon-btn" onClick={onClose} aria-label={t.match.close}>
            ✕
          </button>
        </div>

        {!match ? (
          detail.status === "error" ? (
            <ErrorState error={detail.error} onRetry={detail.retry} />
          ) : (
            <SkeletonList rows={3} />
          )
        ) : (
          <>
            <div className="fb-detail-head">
              <StatusBadge match={match} />
              <p className="fb-detail-muted">
                {formatLongDate(match.utcDate, locale)} · {formatTime(match.utcDate, locale)}
                {matchContext(match, t, league) && ` · ${matchContext(match, t, league)}`}
              </p>
            </div>

            <div className="fb-scoreboard">
              <div className="fb-scoreboard-team">
                <TeamCrest team={match.homeTeam} size={56} />
                <span>{match.homeTeam?.name ?? t.match.tbd}</span>
              </div>
              <div className="fb-scoreboard-score">
                {match.score.home != null ? (
                  // Fila propia: el contenedor es columna (marcador arriba, descanso abajo)
                  <span className="fb-scoreboard-result">
                    {match.score.home}
                    <span className="fb-score-sep">–</span>
                    {match.score.away}
                  </span>
                ) : (
                  <span className="fb-score-vs">{formatTime(match.utcDate, locale)}</span>
                )}
                {scoreNote(match.score, t) && (
                  <span className="fb-halftime fb-score-extra">{scoreNote(match.score, t)}</span>
                )}
                {match.score.halfHome != null && (
                  <span className="fb-halftime">
                    {t.match.halfTime}: {match.score.halfHome}–{match.score.halfAway}
                  </span>
                )}
              </div>
              <div className="fb-scoreboard-team">
                <TeamCrest team={match.awayTeam} size={56} />
                <span>{match.awayTeam?.name ?? t.match.tbd}</span>
              </div>
            </div>

            {(match.venue || match.referee || match.attendance) && (
              <dl className="fb-facts">
                {match.venue && (
                  <div>
                    <dt>{t.match.venue}</dt>
                    <dd>{match.venue}</dd>
                  </div>
                )}
                {match.referee && (
                  <div>
                    <dt>{t.match.referee}</dt>
                    <dd>{match.referee}</dd>
                  </div>
                )}
                {match.attendance && (
                  <div>
                    <dt>{t.match.attendance}</dt>
                    <dd>{match.attendance.toLocaleString(locale)}</dd>
                  </div>
                )}
              </dl>
            )}

            {detail.status === "loading" && !detail.data && <SkeletonList rows={2} />}
            {/* Ya tenemos el resumen: si el detalle falla (p. ej. límite de
                peticiones) no se muestra un error, solo falta lo extra */}
            {detail.status === "error" && !detail.data && played && (
              <p className="fb-detail-note">{t.match.noExtra}</p>
            )}

            {detail.data && (
              <>
                {played && (detail.data.goals.length > 0 || hasExtra) && (
                  <section className="fb-detail-section">
                    <h3>{t.match.goals}</h3>
                    <Goals match={detail.data} t={t} />
                  </section>
                )}

                {detail.data.home?.lineup.length > 0 && (
                  <section className="fb-detail-section">
                    <h3>{t.match.lineups}</h3>
                    <div className="fb-lineups">
                      <Lineup team={detail.data.homeTeam} side={detail.data.home} t={t} />
                      <Lineup team={detail.data.awayTeam} side={detail.data.away} t={t} />
                    </div>
                  </section>
                )}

                <Statistics match={detail.data} t={t} />

                {played && !hasExtra && <p className="fb-detail-note">{t.match.noExtra}</p>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
