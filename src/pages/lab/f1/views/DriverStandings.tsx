import { useF1 } from "../context/f1Context";
import { useF1Resource } from "../hooks/useF1Resource";
import { resources } from "../lib/api";
import { formatPoints } from "../lib/format";
import { gapToLeader } from "../lib/utils";
import { DataNotice, ResourceView } from "../components/States";
import TeamMark from "../components/TeamMark";

export default function DriverStandings() {
  const { t, season, locale, openDriver } = useF1();
  const standings = useF1Resource(resources.driverStandings(season));

  return (
    <>
      <DataNotice resource={standings} />
      <ResourceView
        resource={standings}
        isEmpty={(s) => s.entries.length === 0}
        emptyText={t.standings.empty}
        rows={10}
      >
        {({ round, entries }) => {
          const leader = entries[0]?.points;
          return (
            <>
              {round && <p className="f1-caption">{t.standings.afterRound(round)}</p>}
              <div className="f1-table-scroll">
                <table className="f1-table">
                  <thead>
                    <tr>
                      <th scope="col" className="f1-col-pos">{t.standings.pos}</th>
                      <th scope="col">{t.standings.driver}</th>
                      <th scope="col" className="f1-col-team">{t.standings.team}</th>
                      <th scope="col" className="f1-num">{t.standings.wins}</th>
                      <th scope="col" className="f1-num">{t.standings.points}</th>
                      <th scope="col" className="f1-num f1-col-gap">{t.standings.gap}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((s) => {
                      const team = s.teams.at(-1);
                      const gap = gapToLeader(s.points, leader);
                      return (
                        <tr key={s.driver.id}>
                          <td className="f1-col-pos">{s.position ?? "—"}</td>
                          <th scope="row" className="f1-col-name">
                            <button
                              type="button"
                              className="f1-name-btn"
                              onClick={() => openDriver(s.driver.id)}
                              aria-label={t.standings.open(s.driver.name)}
                            >
                              <TeamMark teamId={team?.id} />
                              <span className="f1-name-full">{s.driver.name}</span>
                              {s.driver.code && <span className="f1-code">{s.driver.code}</span>}
                            </button>
                          </th>
                          <td className="f1-col-team">{s.teams.map((x) => x.name).join(" / ")}</td>
                          <td className="f1-num">{s.wins}</td>
                          <td className="f1-num f1-points">{formatPoints(s.points, locale)}</td>
                          <td className="f1-num f1-col-gap">{gap === null ? "—" : `−${formatPoints(gap, locale)}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      </ResourceView>
    </>
  );
}
