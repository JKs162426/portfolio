import { useCallback, useId, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { FootballProvider } from "./FootballProvider";
import { useFootball } from "./footballContext";
import { STATUS_FILTERS } from "./utils";
import { DEFAULT_LEAGUE, isLeagueCode } from "./leagues";
import LeagueSelect from "./LeagueSelect";
import SearchBar from "./SearchBar";
import LeagueTable from "./LeagueTable";
import MatchesByTeam from "./MatchesByTeam";
import MatchesByDay from "./MatchesByDay";
import MatchDetails from "./MatchDetails";
import "../../../styles/football.css";

const VIEWS = ["table", "team", "day"];

// Valores por defecto que no se escriben en la URL
const DEFAULTS = { status: "all", page: 1, view: "table", league: DEFAULT_LEAGUE };

function FootballView() {
  const { t, league } = useFootball();
  useDocumentTitle(t.docTitle(league.name));

  // Vista, filtros, página y partido abierto viven en la URL: se pueden
  // compartir, y "Atrás" vuelve a la vista anterior sin perder nada
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const view = VIEWS.includes(params.get("view")) ? params.get("view") : "table";
  const teamId = Number(params.get("team")) || null;
  // Filtro propio de la vista por día: elegir un equipo no debe ocultar el resto de partidos
  const dayTeamId = Number(params.get("dayTeam")) || null;
  const status = STATUS_FILTERS.includes(params.get("status")) ? params.get("status") : "all";
  const page = Number(params.get("page")) || 1;
  const matchId = Number(params.get("match")) || null;

  // La búsqueda es local: no tiene sentido guardarla en el historial
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // patch: { clave: valor }, null borra el parámetro.
  // Cualquier cambio de filtro vuelve a la página 1 salvo keepPage.
  const update = useCallback(
    (patch, { keepPage = false, replace = false, state } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value == null || value === DEFAULTS[key]) next.delete(key);
            else next.set(key, String(value));
          }
          if (!keepPage && !("page" in patch)) next.delete("page");
          return next;
        },
        { replace, state }
      );
    },
    [setParams]
  );

  const selectTeam = useCallback((id) => update({ view: "team", team: id }), [update]);

  // Los ids de equipo y partido son de la liga anterior: se descartan
  const selectLeague = useCallback(
    (code) => update({ league: code, team: null, dayTeam: null, match: null, date: null }),
    [update]
  );

  const openMatch = useCallback(
    (id) => update({ match: id }, { keepPage: true, state: { modal: true } }),
    [update]
  );

  function closeMatch() {
    // Si el modal se abrió desde la app, "cerrar" = volver atrás en el historial
    if (location.state?.modal) navigate(-1);
    else update({ match: null }, { keepPage: true, replace: true });
  }

  // ---------- Pestañas (patrón ARIA tabs) ----------
  const tabsId = useId();
  const tabRefs = useRef({});

  function handleTabKeyDown(e) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = VIEWS[(VIEWS.indexOf(view) + step + VIEWS.length) % VIEWS.length];
    update({ view: next });
    tabRefs.current[next]?.focus();
  }

  const viewProps = { status, page, onChange: update, onOpen: openMatch };

  return (
    <section className="fb-app">
      <header className="fb-header">
        <div className="fb-label">{t.label}</div>
        <h1 className="fb-title">
          {t.title}
          <span className="fb-accent">.</span>
        </h1>
        <p className="fb-sub">
          {t.sub} <span className="fb-source">{t.source}</span>
        </p>
      </header>

      <LeagueSelect value={league.code} onChange={selectLeague} />

      <SearchBar
        query={query}
        debouncedQuery={debouncedQuery}
        onQueryChange={setQuery}
        onSelectTeam={selectTeam}
      />

      <div className="fb-tabs" role="tablist" aria-label={t.views.label}>
        {VIEWS.map((name) => (
          <button
            key={name}
            ref={(el) => {
              tabRefs.current[name] = el;
            }}
            type="button"
            role="tab"
            id={`${tabsId}-${name}`}
            aria-selected={view === name}
            aria-controls={`${tabsId}-panel`}
            tabIndex={view === name ? 0 : -1}
            className={`fb-tab ${view === name ? "active" : ""}`}
            onClick={() => update({ view: name })}
            onKeyDown={handleTabKeyDown}
          >
            {t.views[name]}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${view}`}>
        {view === "table" && <LeagueTable query={debouncedQuery} onSelectTeam={selectTeam} />}
        {view === "team" && (
          <MatchesByTeam teamId={teamId} month={params.get("month")} {...viewProps} />
        )}
        {view === "day" && (
          <MatchesByDay teamId={dayTeamId} date={params.get("date")} {...viewProps} />
        )}
      </div>

      {matchId && <MatchDetails key={matchId} matchId={matchId} onClose={closeMatch} />}
    </section>
  );
}

export default function FootballApp() {
  const [params] = useSearchParams();
  const league = isLeagueCode(params.get("league")) ? params.get("league") : DEFAULT_LEAGUE;

  // key: al cambiar de liga se reinicia el estado (datos, búsqueda, sondeo en vivo)
  return (
    <FootballProvider key={league} league={league}>
      <FootballView />
    </FootballProvider>
  );
}
