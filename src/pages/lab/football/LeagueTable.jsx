import { memo, useMemo, useState } from "react";
import { useFootball } from "./footballContext";
import { searchTeams, sortTable } from "./utils";
import { zoneFor } from "./leagues";
import { DataNotice, ErrorState, Loading, EmptyState } from "./States";
import TeamCrest from "./TeamCrest";

// Orden de columnas pedido: posición, equipo, puntos, PJ, G, E, P, GF, GC
const COLUMNS = ["position", "team", "points", "played", "won", "draw", "lost", "goalsFor", "goalsAgainst"];
const SHORT_KEY = { position: "pos" };
const ASC_BY_DEFAULT = new Set(["position", "team", "lost", "goalsAgainst"]);

const TableRow = memo(function TableRow({ row, zone, onSelectTeam, t }) {
  return (
    <tr className={zone ? `fb-zone-${zone}` : undefined}>
      <td className="fb-col-pos">{row.position}</td>
      <th scope="row" className="fb-col-team">
        <button
          type="button"
          className="fb-team-link"
          onClick={() => onSelectTeam(row.team.id)}
          aria-label={t.table.viewTeam(row.team.name)}
        >
          <TeamCrest team={row.team} size={22} />
          <span className="fb-team-full">{row.team.shortName}</span>
          <span className="fb-team-tla">{row.team.tla}</span>
        </button>
      </th>
      <td className="fb-col-points">{row.points}</td>
      <td>{row.played}</td>
      <td>{row.won}</td>
      <td>{row.draw}</td>
      <td>{row.lost}</td>
      <td>{row.goalsFor}</td>
      <td>{row.goalsAgainst}</td>
    </tr>
  );
});

export default function LeagueTable({ query, onSelectTeam }) {
  const { t, standings, league } = useFootball();
  const [sort, setSort] = useState({ key: "position", dir: "asc" });

  const table = useMemo(() => standings.data?.table ?? [], [standings.data]);

  const rows = useMemo(() => {
    let result = table;
    if (query.trim()) {
      const ids = new Set(searchTeams(table.map((r) => r.team), query, Infinity).map((tm) => tm.id));
      result = result.filter((r) => ids.has(r.team.id));
    }
    return sortTable(result, sort.key, sort.dir);
  }, [table, query, sort]);

  if (!standings.data) {
    if (standings.status === "error") {
      return <ErrorState error={standings.error} onRetry={standings.retry} />;
    }
    return <Loading rows={10} variant="row" />;
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: ASC_BY_DEFAULT.has(key) ? "asc" : "desc" }
    );
  }

  // Las zonas dependen de la liga y se calculan sobre la posición oficial,
  // así siguen siendo correctas con la tabla ordenada o filtrada
  const showZones = table.length >= 10;

  return (
    <div className="fb-panel">
      <DataNotice resource={standings} />
      {query.trim() && (
        <p className="fb-filter-note" aria-live="polite">
          {t.table.filtered(rows.length, table.length)}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState title={t.table.empty(query.trim())} hint={t.search.hint} />
      ) : (
        <div className="fb-table-scroll">
          <table className="fb-table">
            <caption className="fb-sr-only">{t.table.caption(league.name)}</caption>
            <thead>
              <tr>
                {COLUMNS.map((key) => {
                  const shortKey = SHORT_KEY[key] ?? key;
                  const active = sort.key === key;
                  return (
                    <th
                      key={key}
                      scope="col"
                      className={`fb-col-${key === "position" ? "pos" : key}`}
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        className={`fb-sort ${active ? "active" : ""}`}
                        onClick={() => toggleSort(key)}
                        title={t.table.sortBy(t.table.long[shortKey])}
                      >
                        <abbr title={t.table.long[shortKey]}>{t.table[shortKey]}</abbr>
                        <span className="fb-sort-arrow" aria-hidden="true">
                          {active ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TableRow
                  key={row.team.id}
                  row={row}
                  zone={showZones ? zoneFor(league, row.position, table.length) : null}
                  onSelectTeam={onSelectTeam}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showZones && rows.length > 0 && (
        <ul className="fb-legend">
          <li className="fb-legend-top">{t.table.top}</li>
          {league.zones.playoff > 0 && <li className="fb-legend-playoff">{t.table.playoff}</li>}
          <li className="fb-legend-bottom">{t.table.bottom}</li>
        </ul>
      )}
    </div>
  );
}
