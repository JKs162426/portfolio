import { useF1 } from "../context/f1Context";
import { useF1Resource } from "../hooks/useF1Resource";
import { resources } from "../lib/api";
import { finishLabel, formatPoints } from "../lib/format";
import { summarizeDriver } from "../lib/utils";
import type { DriverRace } from "../lib/types";
import { DataNotice, ResourceView } from "../components/States";
import Modal from "../components/Modal";
import TeamMark from "../components/TeamMark";

function Summary({ races }: { races: DriverRace[] }) {
  const { t, locale } = useF1();
  const s = summarizeDriver(races);
  const items: [string, string][] = [
    [t.driver.stats.starts, String(s.starts)],
    [t.driver.stats.wins, String(s.wins)],
    [t.driver.stats.podiums, String(s.podiums)],
    [t.driver.stats.best, s.best === null ? "—" : `P${s.best}`],
    [t.driver.stats.dnfs, String(s.dnfs)],
    [t.driver.stats.points, formatPoints(s.points, locale)],
  ];
  return (
    <dl className="f1-stats">
      {items.map(([label, value]) => (
        <div key={label} className="f1-stat">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function DriverDetails({ driverId, onClose }: { driverId: string; onClose: () => void }) {
  const { t, season, locale, openRace } = useF1();
  const seasonResults = useF1Resource(resources.driverSeason(season, driverId));
  // Para la posición en el campeonato (sale de la caché si ya se vio la tabla)
  const standings = useF1Resource(resources.driverStandings(season));

  const standing = standings.data?.entries.find((s) => s.driver.id === driverId);
  const driver = seasonResults.data?.driver ?? standing?.driver;
  const team = standing?.teams.at(-1) ?? seasonResults.data?.races.at(-1)?.team;

  const subtitle = [
    driver?.number && t.driver.number(driver.number),
    driver?.nationality,
    team?.name,
    standing?.position && t.driver.championship(standing.position, standing.points),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal label={`${season} · ${t.views.drivers}`} title={driver?.name ?? driverId} subtitle={subtitle} onClose={onClose}>
      <DataNotice resource={seasonResults} />
      <ResourceView resource={seasonResults} isEmpty={(d) => d.races.length === 0} emptyText={t.driver.empty}>
        {({ races }) => (
          <>
            <Summary races={races} />
            <div className="f1-table-scroll">
              <table className="f1-table f1-table-compact">
                <thead>
                  <tr>
                    <th scope="col" className="f1-col-pos">{t.driver.round}</th>
                    <th scope="col">{t.driver.grandPrix}</th>
                    <th scope="col" className="f1-num">{t.race.grid}</th>
                    <th scope="col" className="f1-num">{t.driver.finish}</th>
                    <th scope="col" className="f1-num">{t.standings.points}</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((r) => (
                    <tr key={r.round} className={r.finish.classified ? "" : "f1-row-out"}>
                      <td className="f1-col-pos">{r.round}</td>
                      <th scope="row" className="f1-col-name">
                        <button type="button" className="f1-name-btn" onClick={() => openRace(r.round)}>
                          <TeamMark teamId={r.team.id} />
                          <span className="f1-name-full">{r.name}</span>
                        </button>
                      </th>
                      <td className="f1-num">{r.grid === 0 ? t.race.pitLane : (r.grid ?? "—")}</td>
                      <td className={`f1-num ${r.finish.classified && r.finish.position <= 3 ? "f1-podium" : ""}`}>
                        {finishLabel(r.finish, t)}
                      </td>
                      <td className="f1-num f1-points">{r.points > 0 ? formatPoints(r.points, locale) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ResourceView>
    </Modal>
  );
}
