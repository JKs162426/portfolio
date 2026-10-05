import { memo, useMemo, useState } from "react";
import { useFootball } from "../context/footballContext";
import { computeGroupTables, knockoutRounds, searchTeams, sortTable } from "../lib/utils";
import { zoneFor } from "../lib/leagues";
import { groupName, stageName } from "../lib/format";
import { DataNotice, ErrorState, Loading, EmptyState } from "../components/States";
import MatchCard from "../components/MatchCard";
import TeamCrest from "../components/TeamCrest";

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

function StandingsTable({ caption, rows, size, zones, sort, onSort, onSelectTeam, t }) {
  return (
    <div className="fb-table-scroll">
      <table className="fb-table">
        <caption className="fb-sr-only">{caption}</caption>
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
                    onClick={() => onSort(key)}
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
              // La zona sale de la posición oficial: sigue siendo correcta con
              // la tabla reordenada o filtrada
              zone={zoneFor(zones, row.position, size)?.kind}
              onSelectTeam={onSelectTeam}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Rondas eliminatorias de una copa, la más reciente primero
function KnockoutRounds({ rounds, onOpen, t, league }) {
  return (
    <section className="fb-knockout">
      <h2 className="fb-section-title">{t.table.knockout}</h2>
      {[...rounds].reverse().map((round) => (
        <div key={round.stage} className="fb-round">
          <h3 className="fb-group-title">{stageName(round.stage, t, league)}</h3>
          <ul className="fb-match-list">
            {round.matches.map((match) => (
              <MatchCard key={match.id} match={match} onOpen={onOpen} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default function LeagueTable({ query, onSelectTeam, onOpen }) {
  const { t, standings, matches, matchList, league } = useFootball();
  const [sort, setSort] = useState({ key: "position", dir: "asc" });

  // Libertadores: la API no da clasificación, se calcula con los partidos
  const computed = league.standings === false;
  const source = computed ? matches : standings;

  const groups = useMemo(
    () => (computed ? computeGroupTables(matchList) : standings.data?.groups ?? []),
    [computed, matchList, standings.data]
  );
  const rounds = useMemo(
    () => (league.type === "CUP" ? knockoutRounds(matchList) : []),
    [league.type, matchList]
  );
  const zones = groups.length > 1 ? league.groupZones : league.zones;

  const visibleGroups = useMemo(() => {
    const q = query.trim();
    return groups.map((group) => {
      let rows = group.table;
      if (q) {
        const ids = new Set(searchTeams(rows.map((r) => r.team), q, Infinity).map((tm) => tm.id));
        rows = rows.filter((r) => ids.has(r.team.id));
      }
      return { ...group, size: group.table.length, rows: sortTable(rows, sort.key, sort.dir) };
    });
  }, [groups, query, sort]);

  if (!source.data) {
    if (source.status === "error") {
      return <ErrorState error={source.error} onRetry={source.retry} />;
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

  const q = query.trim();
  const total = groups.reduce((n, g) => n + g.table.length, 0);
  const shown = visibleGroups.reduce((n, g) => n + g.rows.length, 0);
  const multiple = groups.length > 1;
  // Etiquetas de la leyenda sin repetir (cada zona tiene su color)
  const legend = zones ? [...new Map(zones.map((z) => [z.label, z])).values()] : [];

  return (
    <div className="fb-panel">
      <DataNotice resource={source} />

      {rounds.length > 0 && !q && (
        <KnockoutRounds rounds={rounds} onOpen={onOpen} t={t} league={league} />
      )}

      {groups.length === 0 ? (
        rounds.length === 0 && <EmptyState title={t.table.noTable} hint={t.table.noTableHint} />
      ) : (
        <section className="fb-tables">
          {rounds.length > 0 && !q && (
            <h2 className="fb-section-title">{multiple ? t.table.groups : t.stages.LEAGUE_STAGE}</h2>
          )}
          {q && (
            <p className="fb-filter-note" aria-live="polite">
              {t.table.filtered(shown, total)}
            </p>
          )}
          {computed && <p className="fb-filter-note">{t.table.computed}</p>}

          {shown === 0 ? (
            <EmptyState title={t.table.empty(q)} hint={t.search.hint} />
          ) : (
            <div className={multiple ? "fb-group-grid" : undefined}>
              {visibleGroups
                .filter((group) => group.rows.length > 0)
                .map((group) => (
                  <div key={group.name ?? "table"} className="fb-group">
                    {multiple && <h3 className="fb-group-title">{groupName(group.name, t)}</h3>}
                    <StandingsTable
                      caption={multiple ? `${league.name} — ${groupName(group.name, t)}` : t.table.caption(league.name)}
                      rows={group.rows}
                      size={group.size}
                      zones={zones}
                      sort={sort}
                      onSort={toggleSort}
                      onSelectTeam={onSelectTeam}
                      t={t}
                    />
                  </div>
                ))}
            </div>
          )}

          {legend.length > 0 && shown > 0 && (
            <ul className="fb-legend">
              {legend.map((zone) => (
                <li key={zone.label} className={`fb-legend-${zone.kind}`}>
                  {t.table.zones[zone.label]}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
