import { useMemo } from "react";
import { useFootball } from "./footballContext";
import { formatMonthKey } from "./format";
import {
  clampMonth,
  filterMatches,
  isMonthKey,
  seasonMonthRange,
  shiftMonth,
  toMonthKey,
} from "./utils";
import { DataNotice, EmptyState, ErrorState, Loading } from "./States";
import MatchList from "./MatchList";
import StatusFilter from "./StatusFilter";
import TeamCrest from "./TeamCrest";

function TeamPicker({ onPick }) {
  const { t, teams, standings } = useFootball();

  return (
    <div className="fb-panel">
      <EmptyState title={t.team.pickTitle} hint={t.team.pickHint} />
      {teams.length === 0 && standings.status === "loading" ? (
        <Loading rows={8} variant="chip" />
      ) : (
        <ul className="fb-team-grid">
          {teams.map((team) => (
            <li key={team.id}>
              <button type="button" className="fb-team-pick" onClick={() => onPick(team.id)}>
                <TeamCrest team={team} size={32} />
                <span>{team.shortName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MatchesByTeam({ teamId, month, status, page, onChange, onOpen }) {
  const { t, locale, matches, matchList, teamsById } = useFootball();
  const team = teamsById.get(teamId);

  const range = useMemo(() => seasonMonthRange(matchList), [matchList]);
  const isSeason = month === "all";
  const monthKey = isSeason
    ? null
    : clampMonth(isMonthKey(month) ? month : toMonthKey(new Date()), range);

  const inPeriod = useMemo(
    () => (team ? filterMatches(matchList, { teamId, monthKey }) : []),
    [matchList, team, teamId, monthKey]
  );
  const visible = useMemo(
    () => filterMatches(inPeriod, { status }),
    [inPeriod, status]
  );

  if (!team) {
    return <TeamPicker onPick={(id) => onChange({ team: id })} />;
  }

  const shownMonth = monthKey ?? clampMonth(toMonthKey(new Date()), range);
  const canPrev = range && !isSeason && monthKey > range.first;
  const canNext = range && !isSeason && monthKey < range.last;

  return (
    <div className="fb-panel">
      <div className="fb-view-head">
        <div className="fb-team-title">
          <TeamCrest team={team} size={40} />
          <h2>{team.name}</h2>
          <button type="button" className="fb-link-btn" onClick={() => onChange({ team: null })}>
            {t.team.change}
          </button>
        </div>

        <div className="fb-toolbar">
          <div className="fb-stepper">
            <button
              type="button"
              className="fb-icon-btn"
              onClick={() => onChange({ month: shiftMonth(monthKey, -1) })}
              disabled={!canPrev}
              aria-label={t.team.prevMonth}
            >
              ‹
            </button>
            <span className="fb-stepper-label" aria-live="polite">
              {isSeason ? t.team.season : formatMonthKey(monthKey, locale)}
            </span>
            <button
              type="button"
              className="fb-icon-btn"
              onClick={() => onChange({ month: shiftMonth(monthKey, 1) })}
              disabled={!canNext}
              aria-label={t.team.nextMonth}
            >
              ›
            </button>
          </div>
          <button
            type="button"
            className={`fb-chip ${isSeason ? "active" : ""}`}
            aria-pressed={isSeason}
            onClick={() => onChange({ month: isSeason ? shownMonth : "all" })}
          >
            {t.team.season}
          </button>
        </div>

        <StatusFilter value={status} onChange={(s) => onChange({ status: s })} />
      </div>

      <DataNotice resource={matches} />

      {!matches.data && matches.status === "error" ? (
        <ErrorState error={matches.error} onRetry={matches.retry} />
      ) : !matches.data ? (
        <Loading rows={4} />
      ) : visible.length === 0 ? (
        inPeriod.length === 0 ? (
          <EmptyState title={t.team.empty} hint={t.team.emptyHint} />
        ) : (
          <EmptyState title={t.team.emptyFiltered} hint={t.team.emptyFilteredHint} />
        )
      ) : (
        <MatchList
          matches={visible}
          page={page}
          onPageChange={(p) => onChange({ page: p }, { keepPage: true })}
          onOpen={onOpen}
          teamId={teamId}
        />
      )}
    </div>
  );
}
