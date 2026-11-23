import { useF1 } from "../context/f1Context";
import { useF1Resource } from "../hooks/useF1Resource";
import { resources } from "../lib/api";
import { formatDate, formatTime } from "../lib/format";
import { daysUntil, raceStatuses } from "../lib/utils";
import type { Race, Winners } from "../lib/types";
import { DataNotice, ResourceView } from "../components/States";
import TeamMark from "../components/TeamMark";

function NextRace({ race }: { race: Race }) {
  const { t, locale, openRace } = useF1();
  return (
    <button type="button" className="f1-next" onClick={() => openRace(race.round)}>
      <span className="f1-next-label">
        {t.races.next} · {t.races.inDays(daysUntil(race.start))}
      </span>
      <span className="f1-next-name">{race.name}</span>
      <span className="f1-next-meta">
        {race.circuit} · {race.locality}, {race.country}
      </span>
      <span className="f1-next-meta">
        {formatDate(race.start, locale)}
        {race.hasTime && ` · ${formatTime(race.start, locale)}`}
        {race.hasSprint && ` · ${t.races.sprint}`}
      </span>
    </button>
  );
}

function Calendar({ schedule, winners }: { schedule: Race[]; winners: Winners }) {
  const { t, locale, openRace } = useF1();
  const statuses = raceStatuses(schedule, winners);
  const next = schedule.find((race) => statuses.get(race.round) === "next");

  return (
    <>
      {next && <NextRace race={next} />}
      <ol className="f1-races">
        {schedule.map((race) => {
          const status = statuses.get(race.round) ?? "upcoming";
          const winner = winners[race.round];
          return (
            <li key={race.round}>
              <button type="button" className={`f1-race f1-race-${status}`} onClick={() => openRace(race.round)}>
                <span className="f1-race-round">{String(race.round).padStart(2, "0")}</span>
                <span className="f1-race-main">
                  <span className="f1-race-name">
                    {race.name}
                    {race.hasSprint && <span className="f1-chip">{t.race.tabs.sprint}</span>}
                  </span>
                  <span className="f1-race-meta">
                    {race.locality}, {race.country} · {formatDate(race.start, locale)}
                  </span>
                </span>
                <span className="f1-race-side">
                  {winner ? (
                    <span className="f1-race-winner">
                      <TeamMark teamId={winner.team.id} />
                      <span className="f1-sr-only">{t.races.winner}: </span>
                      {winner.driver.code ?? winner.driver.familyName}
                    </span>
                  ) : (
                    <span className={`f1-status f1-status-${status}`}>{t.races.status[status]}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="f1-footnote">{t.races.localTime}</p>
    </>
  );
}

export default function RaceCalendar() {
  const { t, season } = useF1();
  const schedule = useF1Resource(resources.schedule(season));
  const winners = useF1Resource(resources.winners(season));

  return (
    <>
      <DataNotice resource={schedule} />
      <ResourceView resource={schedule} isEmpty={(races) => races.length === 0} emptyText={t.races.empty}>
        {(races) => (
          // Sin ganadores (cargando o error) el calendario se muestra igual
          <Calendar schedule={races} winners={winners.data ?? {}} />
        )}
      </ResourceView>
    </>
  );
}
