import { useId, useMemo, useState } from "react";
import { useFootball } from "./footballContext";
import { searchTeams } from "./utils";
import TeamCrest from "./TeamCrest";

/**
 * Buscador de equipos con sugerencias (patrón ARIA combobox).
 * `query` es lo que escribe el usuario; `debouncedQuery` llega con retraso
 * desde el padre y es lo que dispara la búsqueda.
 */
export default function SearchBar({ query, debouncedQuery, onQueryChange, onSelectTeam }) {
  const { t, teams } = useFootball();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const results = useMemo(() => searchTeams(teams, debouncedQuery), [teams, debouncedQuery]);
  const showList = open && debouncedQuery.trim() !== "" && teams.length > 0;
  const activeIndex = active < results.length ? active : -1;

  function select(team) {
    onSelectTeam(team.id);
    onQueryChange("");
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + results.length) % results.length);
    } else if (e.key === "Enter") {
      // Sin selección con flechas, Enter elige el mejor resultado
      const team = results[activeIndex] ?? results[0];
      if (team) {
        e.preventDefault();
        select(team);
      }
    } else if (e.key === "Escape") {
      if (showList) setOpen(false);
      else onQueryChange("");
    }
  }

  return (
    <div className="fb-search">
      <label className="fb-sr-only" htmlFor={`${listId}-input`}>
        {t.search.label}
      </label>
      <svg className="fb-search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id={`${listId}-input`}
        className="fb-search-input"
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        spellCheck="false"
        placeholder={t.search.placeholder}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          type="button"
          className="fb-search-clear"
          onClick={() => onQueryChange("")}
          aria-label={t.search.clear}
        >
          ✕
        </button>
      )}

      <span className="fb-sr-only" aria-live="polite">
        {debouncedQuery.trim() && t.search.results(results.length)}
      </span>

      {showList && (
        <ul className="fb-suggestions" id={listId} role="listbox" aria-label={t.search.label}>
          {results.length === 0 ? (
            <li className="fb-suggestion-empty" role="presentation">
              <strong>{t.search.noResults(debouncedQuery.trim())}</strong>
              <span>{t.search.hint}</span>
            </li>
          ) : (
            results.map((team, i) => (
              <li
                key={team.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`fb-suggestion ${i === activeIndex ? "active" : ""}`}
                // mousedown en vez de click: evita que el blur del input cierre la lista antes
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(team);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <TeamCrest team={team} size={22} />
                <span>{team.name}</span>
                <span className="fb-suggestion-tla">{team.tla}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
