import { useEffect, useMemo, useRef } from "react";
import { useLang } from "../../../../context/useLang";
import content from "../../../../data/content";
import { useFootballData } from "../hooks/useFootballData";
import { useLivePolling } from "../../../../hooks/useLivePolling";
import { getLeagueResources } from "../lib/api";
import { getLeague } from "../lib/leagues";
import { statusGroup } from "../lib/utils";
import { FootballContext } from "./footballContext";

// Si la clasificación falla, los equipos se sacan de los partidos
function teamsFromMatches(matches) {
  const byId = new Map();
  for (const m of matches) {
    for (const team of [m.homeTeam, m.awayTeam]) {
      if (team && !byId.has(team.id)) byId.set(team.id, team);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Carga una sola vez la clasificación y todos los partidos de la temporada
// de una liga (2 peticiones). Las vistas filtran en el cliente, lo que
// respeta el límite de 10 peticiones/minuto del plan gratuito.
// Se monta con key={league}: cambiar de liga reinicia todo su estado.
export function FootballProvider({ league: code, children }) {
  const { lang } = useLang();
  const league = getLeague(code);
  const resources = getLeagueResources(code);
  // Sin clasificación en la API (Libertadores): no se pide; se calcula con los partidos
  const standings = useFootballData(league.standings === false ? null : resources.standings);
  const matches = useFootballData(resources.matches);

  // Con partidos en vivo, los marcadores se refrescan solos cada minuto
  // (1 de las 10 peticiones/min del plan gratuito)
  const liveCount = (matches.data ?? []).filter((m) => statusGroup(m.status) === "live").length;
  useLivePolling(liveCount > 0, matches.retry);

  // Cuando termina un partido en vivo, la clasificación cambia: se recarga
  const previousLive = useRef(liveCount);
  const refreshStandings = standings.retry;
  useEffect(() => {
    if (liveCount < previousLive.current) refreshStandings();
    previousLive.current = liveCount;
  }, [liveCount, refreshStandings]);

  const value = useMemo(() => {
    const matchList = matches.data ?? [];
    // En copas con grupos, los equipos están repartidos en varias tablas
    const standingTeams = (standings.data?.groups ?? []).flatMap((g) => g.table.map((row) => row.team));
    const teams = standingTeams.length
      ? standingTeams.sort((a, b) => a.name.localeCompare(b.name))
      : teamsFromMatches(matchList);

    return {
      t: content[lang].football,
      lang,
      league,
      locale: lang === "es" ? "es-ES" : "en-GB",
      standings,
      matches,
      matchList,
      teams,
      teamsById: new Map(teams.map((team) => [team.id, team])),
      matchesById: new Map(matchList.map((m) => [m.id, m])),
    };
  }, [lang, league, standings, matches]);

  return <FootballContext.Provider value={value}>{children}</FootballContext.Provider>;
}
