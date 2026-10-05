import { useId, useMemo } from "react";
import { useFootball } from "../context/footballContext";
import { formatDayKey } from "../lib/format";
import { filterMatches, isDateKey, matchDates, nearestMatchDate, toDateKey } from "../lib/utils";
import { DataNotice, EmptyState, ErrorState, Loading } from "../components/States";
import MatchList from "../components/MatchList";
import StatusFilter from "../components/StatusFilter";

export default function MatchesByDay({ date, teamId, status, page, onChange, onOpen }) {
  const { t, locale, matches, matchList, teams, league } = useFootball();
  const id = useId();

  const dates = useMemo(() => matchDates(matchList), [matchList]);
  const today = toDateKey(new Date());
  // Sin fecha en la URL: hoy si hay partidos, si no el próximo día con partidos
  const dateKey = isDateKey(date) ? date : nearestMatchDate(dates, today) ?? today;

  const onDay = useMemo(() => filterMatches(matchList, { dateKey }), [matchList, dateKey]);
  const visible = useMemo(
    () => filterMatches(onDay, { teamId, status }),
    [onDay, teamId, status]
  );

  const prev = nearestMatchDate(dates, dateKey, -1);
  const next = nearestMatchDate(dates, dateKey, 1);

  return (
    <div className="fb-panel">
      <div className="fb-view-head">
        <h2 className="fb-day-title">{formatDayKey(dateKey, locale)}</h2>

        <div className="fb-toolbar">
          <div className="fb-stepper">
            <button
              type="button"
              className="fb-icon-btn"
              onClick={() => onChange({ date: prev })}
              disabled={!prev}
              aria-label={t.day.prev}
              title={t.day.prev}
            >
              ‹
            </button>
            <label className="fb-sr-only" htmlFor={`${id}-date`}>
              {t.day.date}
            </label>
            <input
              id={`${id}-date`}
              className="fb-field"
              type="date"
              value={dateKey}
              min={dates[0]}
              max={dates.at(-1)}
              onChange={(e) => isDateKey(e.target.value) && onChange({ date: e.target.value })}
            />
            <button
              type="button"
              className="fb-icon-btn"
              onClick={() => onChange({ date: next })}
              disabled={!next}
              aria-label={t.day.next}
              title={t.day.next}
            >
              ›
            </button>
          </div>
          <button
            type="button"
            className="fb-chip"
            onClick={() => onChange({ date: today })}
            disabled={dateKey === today}
          >
            {t.day.today}
          </button>

          <label className="fb-sr-only" htmlFor={`${id}-team`}>
            {t.day.teamFilter}
          </label>
          <select
            id={`${id}-team`}
            className="fb-field"
            value={teamId ?? ""}
            onChange={(e) => onChange({ dayTeam: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t.day.allTeams}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <StatusFilter value={status} onChange={(s) => onChange({ status: s })} />
      </div>

      <DataNotice resource={matches} />

      {!matches.data && matches.status === "error" ? (
        <ErrorState error={matches.error} onRetry={matches.retry} />
      ) : !matches.data ? (
        <Loading rows={5} />
      ) : visible.length === 0 ? (
        onDay.length === 0 ? (
          <EmptyState title={t.day.empty(league.name)} hint={t.day.emptyHint}>
            {(next || prev) && (
              <button type="button" className="fb-btn" onClick={() => onChange({ date: next ?? prev })}>
                {t.day.goNearest}
              </button>
            )}
          </EmptyState>
        ) : (
          <EmptyState title={t.day.emptyFiltered} hint={t.day.emptyFilteredHint} />
        )
      ) : (
        <MatchList
          matches={visible}
          page={page}
          onPageChange={(p) => onChange({ page: p }, { keepPage: true })}
          onOpen={onOpen}
          teamId={teamId}
          showDate={false}
        />
      )}
    </div>
  );
}
