import { useEffect, useMemo, useRef } from "react";
import { useLang } from "../../../context/useLang";
import content from "../../../data/content";
import { useFootballData } from "../../../hooks/useFootballData";
import { useLivePolling } from "../../../hooks/useLivePolling";
import { getLeagueResources } from "./api";
import { getLeague } from "./leagues";
import { statusGroup } from "./utils";
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
  const resources = getLeagueResources(code);
  const standings = useFootballData(resources.standings);
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
    const teams = standings.data?.table.length
      ? standings.data.table
          .map((row) => row.team)
          .sort((a, b) => a.name.localeCompare(b.name))
      : teamsFromMatches(matchList);

    return {
      t: content[lang].football,
      lang,
      league: getLeague(code),
      locale: lang === "es" ? "es-ES" : "en-GB",
      standings,
      matches,
      matchList,
      teams,
      teamsById: new Map(teams.map((team) => [team.id, team])),
      matchesById: new Map(matchList.map((m) => [m.id, m])),
    };
  }, [lang, code, standings, matches]);

  return <FootballContext.Provider value={value}>{children}</FootballContext.Provider>;
}
