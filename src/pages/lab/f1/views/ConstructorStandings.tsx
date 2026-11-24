import { useF1 } from "../context/f1Context";
import { useF1Resource } from "../hooks/useF1Resource";
import { resources } from "../lib/api";
import { formatPoints } from "../lib/format";
import { driversOfTeam, gapToLeader } from "../lib/utils";
import { DataNotice, ResourceView } from "../components/States";
import TeamMark from "../components/TeamMark";

export default function ConstructorStandings() {
  const { t, season, locale, openDriver } = useF1();
  const standings = useF1Resource(resources.constructorStandings(season));
  // Para listar los pilotos de cada equipo (la misma petición que la vista de pilotos)
  const drivers = useF1Resource(resources.driverStandings(season));

  return (
    <>
      <DataNotice resource={standings} />
      <ResourceView
        resource={standings}
        // El campeonato de constructores empezó en 1958
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
                      <th scope="col">{t.standings.team}</th>
                      <th scope="col" className="f1-col-team">{t.standings.drivers}</th>
                      <th scope="col" className="f1-num">{t.standings.wins}</th>
                      <th scope="col" className="f1-num">{t.standings.points}</th>
                      <th scope="col" className="f1-num f1-col-gap">{t.standings.gap}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((s) => {
                      const gap = gapToLeader(s.points, leader);
                      const teamDrivers = driversOfTeam(drivers.data?.entries ?? [], s.team.id);
                      return (
                        <tr key={s.team.id}>
                          <td className="f1-col-pos">{s.position ?? "—"}</td>
                          <th scope="row" className="f1-col-name">
                            <span className="f1-name">
                              <TeamMark teamId={s.team.id} />
                              {s.team.name}
                            </span>
                          </th>
                          <td className="f1-col-team">
                            {teamDrivers.map((d, i) => (
                              <span key={d.driver.id}>
                                {i > 0 && ", "}
                                <button
                                  type="button"
                                  className="f1-inline-btn"
                                  onClick={() => openDriver(d.driver.id)}
                                  aria-label={t.standings.open(d.driver.name)}
                                >
                                  {d.driver.familyName}
                                </button>
                              </span>
                            ))}
                          </td>
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
