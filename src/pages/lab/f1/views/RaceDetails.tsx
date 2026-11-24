import { useId, useState } from "react";
import { useF1 } from "../context/f1Context";
import { useF1Resource } from "../hooks/useF1Resource";
import { resources } from "../lib/api";
import { finishLabel, formatDate, formatPoints, formatTime } from "../lib/format";
import { positionsGained, raceStatuses } from "../lib/utils";
import type { QualifyingResult, Race, RaceResult } from "../lib/types";
import { DataNotice, EmptyState, Loading, ResourceView } from "../components/States";
import Modal from "../components/Modal";
import TeamMark from "../components/TeamMark";

type Tab = "race" | "qualifying" | "sprint";

function DriverCell({ result }: { result: RaceResult | QualifyingResult }) {
  const { t, openDriver } = useF1();
  return (
    <th scope="row" className="f1-col-name">
      <button
        type="button"
        className="f1-name-btn"
        onClick={() => openDriver(result.driver.id)}
        aria-label={t.standings.open(result.driver.name)}
      >
        <TeamMark teamId={result.team.id} />
        <span className="f1-name-full">{result.driver.name}</span>
        {result.driver.code && <span className="f1-code">{result.driver.code}</span>}
      </button>
      <span className="f1-sub-team">{result.team.name}</span>
    </th>
  );
}

function ResultsTable({ results }: { results: RaceResult[] }) {
  const { t, locale } = useF1();
  return (
    <div className="f1-table-scroll">
      <table className="f1-table f1-table-compact">
        <thead>
          <tr>
            <th scope="col" className="f1-col-pos">{t.standings.pos}</th>
            <th scope="col">{t.standings.driver}</th>
            <th scope="col" className="f1-num">{t.race.grid}</th>
            <th scope="col" className="f1-col-time">{t.race.time}</th>
            <th scope="col" className="f1-num">{t.standings.points}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const gained = r.finish.classified ? positionsGained(r.grid, r.finish.position) : null;
            return (
              <tr key={r.driver.id} className={r.finish.classified ? "" : "f1-row-out"}>
                <td className="f1-col-pos">{finishLabel(r.finish, t)}</td>
                <DriverCell result={r} />
                <td className="f1-num">
                  {r.grid === 0 ? t.race.pitLane : (r.grid ?? "—")}
                  {gained !== null && gained !== 0 && (
                    <span className={`f1-gain ${gained > 0 ? "up" : "down"}`} title={t.race.gained(gained)}>
                      <span aria-hidden="true">{gained > 0 ? "▲" : "▼"}</span>
                      {Math.abs(gained)}
                      <span className="f1-sr-only"> ({t.race.gained(gained)})</span>
                    </span>
                  )}
                </td>
                <td className="f1-col-time">
                  {r.lapsDown !== null ? t.race.lapsDown(r.lapsDown) : (r.time ?? r.status ?? "—")}
                  {r.fastestLap && (
                    <span className="f1-fastest" title={t.race.fastestLap}>
                      <span aria-hidden="true"> ◷</span>
                      <span className="f1-sr-only"> ({t.race.fastestLap})</span>
                    </span>
                  )}
                </td>
                <td className="f1-num f1-points">{r.points > 0 ? formatPoints(r.points, locale) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QualifyingTable({ results }: { results: QualifyingResult[] }) {
  const { t } = useF1();
  return (
    <div className="f1-table-scroll">
      <table className="f1-table f1-table-compact">
        <thead>
          <tr>
            <th scope="col" className="f1-col-pos">{t.standings.pos}</th>
            <th scope="col">{t.standings.driver}</th>
            <th scope="col" className="f1-col-time">Q1</th>
            <th scope="col" className="f1-col-time">Q2</th>
            <th scope="col" className="f1-col-time">Q3</th>
          </tr>
        </thead>
        <tbody>
          {results.map((q) => (
            <tr key={q.driver.id}>
              <td className="f1-col-pos">{q.position}</td>
              <DriverCell result={q} />
              <td className="f1-col-time">{q.q1 ?? "—"}</td>
              <td className="f1-col-time">{q.q2 ?? "—"}</td>
              <td className="f1-col-time">{q.q3 ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Schedule({ race }: { race: Race }) {
  const { t, locale } = useF1();
  return (
    <>
      <h3 className="f1-modal-heading">{t.race.schedule}</h3>
      <ul className="f1-sessions">
        {race.sessions.map((s) => (
          <li key={s.kind}>
            <span>{t.race.sessions[s.kind]}</span>
            <span className="f1-sessions-time">
              {formatDate(s.start, locale)}
              {s.hasTime && ` · ${formatTime(s.start, locale)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="f1-footnote">{t.races.localTime}</p>
    </>
  );
}

function SessionResults({ race, tab }: { race: Race; tab: Tab }) {
  const { t, season } = useF1();
  // Solo se pide la pestaña activa: cada una es una petición
  const results = useF1Resource(
    tab === "race"
      ? resources.raceResults(season, race.round)
      : tab === "sprint"
        ? resources.sprintResults(season, race.round)
        : null
  );
  const qualifying = useF1Resource(tab === "qualifying" ? resources.qualifying(season, race.round) : null);

  if (tab === "qualifying") {
    return (
      <>
        <DataNotice resource={qualifying} />
        <ResourceView resource={qualifying} isEmpty={(r) => r.length === 0} emptyText={t.race.noResults}>
          {(rows) => <QualifyingTable results={rows} />}
        </ResourceView>
      </>
    );
  }
  return (
    <>
      <DataNotice resource={results} />
      <ResourceView resource={results} isEmpty={(r) => r.length === 0} emptyText={t.race.noResults}>
        {(rows) => <ResultsTable results={rows} />}
      </ResourceView>
    </>
  );
}

function RaceBody({ race, raced }: { race: Race; raced: boolean }) {
  const { t } = useF1();
  const [tab, setTab] = useState<Tab>("race");
  const tabsId = useId();

  if (!raced) {
    return (
      <>
        <p className="f1-detail-muted">{t.race.notRaced}</p>
        <Schedule race={race} />
      </>
    );
  }

  const tabs: Tab[] = race.hasSprint ? ["race", "sprint", "qualifying"] : ["race", "qualifying"];
  return (
    <>
      <div className="f1-tabs f1-tabs-small" role="tablist" aria-label={t.views.label}>
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`${tabsId}-${name}`}
            aria-selected={tab === name}
            aria-controls={`${tabsId}-panel`}
            className={`f1-tab ${tab === name ? "active" : ""}`}
            onClick={() => setTab(name)}
          >
            {t.race.tabs[name]}
          </button>
        ))}
      </div>
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
        <SessionResults race={race} tab={tab} />
      </div>
    </>
  );
}

export default function RaceDetails({ round, onClose }: { round: number; onClose: () => void }) {
  const { t, season, locale } = useF1();
  // Las dos salen de la caché: el calendario ya las pidió
  const schedule = useF1Resource(resources.schedule(season));
  const winners = useF1Resource(resources.winners(season));

  const race = schedule.data?.find((r) => r.round === round);
  const status = race && schedule.data ? raceStatuses(schedule.data, winners.data ?? {}).get(round) : undefined;
  const raced = status === "done" || status === "pending";

  return (
    <Modal
      label={`${season} · ${t.races.round(round)}`}
      title={race?.name ?? t.races.round(round)}
      subtitle={race && `${race.circuit} · ${race.locality}, ${race.country} · ${formatDate(race.start, locale, { year: true })}`}
      onClose={onClose}
    >
      {race ? (
        <RaceBody race={race} raced={raced} />
      ) : schedule.status === "loading" ? (
        <Loading />
      ) : (
        <EmptyState title={t.races.empty} />
      )}
    </Modal>
  );
}
