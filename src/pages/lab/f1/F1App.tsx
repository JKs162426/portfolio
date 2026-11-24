import { useCallback, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../../context/useLang";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { F1Context, type F1ContextValue } from "./context/f1Context";
import { getMessages } from "./i18n";
import { currentSeason, parseSeason } from "./lib/seasons";
import SeasonSelect from "./components/SeasonSelect";
import RaceCalendar from "./views/RaceCalendar";
import DriverStandings from "./views/DriverStandings";
import ConstructorStandings from "./views/ConstructorStandings";
import RaceDetails from "./views/RaceDetails";
import DriverDetails from "./views/DriverDetails";
import "./styles/f1.css";

const VIEWS = ["races", "drivers", "constructors"] as const;
type View = (typeof VIEWS)[number];

const isView = (value: string | null): value is View => VIEWS.includes(value as View);

const DRIVER_ID = /^[a-z][a-z0-9_]{1,40}$/;

// En el historial se guarda cuántos modales hay abiertos en cadena
// (carrera → piloto → carrera…): "Atrás" cierra uno, "Cerrar" vuelve a la lista
interface ModalState {
  modalDepth?: number;
}

export default function F1App() {
  const { lang } = useLang() as { lang: string };
  const t = getMessages(lang);

  // Temporada, vista y modal abierto viven en la URL: se pueden compartir
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const season = parseSeason(params.get("season"));
  const view: View = isView(params.get("view")) ? (params.get("view") as View) : "races";
  const round = Number(params.get("round")) || null;
  const driverParam = params.get("driver");
  const driverId = driverParam && DRIVER_ID.test(driverParam) ? driverParam : null;
  const depth = (location.state as ModalState | null)?.modalDepth ?? 0;

  useDocumentTitle(t.docTitle(season));

  // patch: { clave: valor }; null o el valor por defecto borran el parámetro
  const update = useCallback(
    (patch: Record<string, string | number | null>, options: { replace?: boolean; state?: ModalState } = {}) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          const isDefault =
            (key === "season" && value === currentSeason()) || (key === "view" && value === "races");
          if (value === null || isDefault) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      }, options);
    },
    [setParams]
  );

  const openRace = useCallback(
    (r: number) => update({ round: r, driver: null }, { state: { modalDepth: depth + 1 } }),
    [update, depth]
  );
  const openDriver = useCallback(
    (id: string) => update({ driver: id, round: null }, { state: { modalDepth: depth + 1 } }),
    [update, depth]
  );

  function closeModal() {
    // Abierto desde la app: se vuelve atrás hasta la lista. Desde un enlace: se quita el parámetro.
    if (depth > 0) navigate(-depth);
    else update({ round: null, driver: null }, { replace: true });
  }

  // Los modales abiertos son de la temporada anterior: se descartan
  const selectSeason = (s: number) => update({ season: s, round: null, driver: null });

  const context = useMemo<F1ContextValue>(
    () => ({ season, t, locale: t.locale, openRace, openDriver }),
    [season, t, openRace, openDriver]
  );

  // ---------- Pestañas (patrón ARIA tabs) ----------
  const tabsId = useId();
  const tabRefs = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = VIEWS[(VIEWS.indexOf(view) + step + VIEWS.length) % VIEWS.length]!;
    update({ view: next });
    tabRefs.current[next]?.focus();
  }

  return (
    <F1Context.Provider value={context}>
      <section className="f1-app">
        <header className="f1-header">
          <div className="f1-label">{t.label}</div>
          <h1 className="f1-title">
            {t.title}
            <span className="f1-accent">.</span>
          </h1>
          <p className="f1-sub">
            {t.sub} <span className="f1-source">{t.source}</span>
          </p>
        </header>

        <div className="f1-toolbar">
          <div className="f1-tabs" role="tablist" aria-label={t.views.label}>
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
                className={`f1-tab ${view === name ? "active" : ""}`}
                onClick={() => update({ view: name })}
                onKeyDown={handleTabKeyDown}
              >
                {t.views[name]}
              </button>
            ))}
          </div>
          <SeasonSelect onChange={selectSeason} />
        </div>

        {/* key: al cambiar de temporada se reinicia el estado de la vista */}
        <div key={season} id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${view}`}>
          {view === "races" && <RaceCalendar />}
          {view === "drivers" && <DriverStandings />}
          {view === "constructors" && <ConstructorStandings />}
        </div>

        {round && <RaceDetails key={`r${season}-${round}`} round={round} onClose={closeModal} />}
        {!round && driverId && (
          <DriverDetails key={`d${season}-${driverId}`} driverId={driverId} onClose={closeModal} />
        )}
      </section>
    </F1Context.Provider>
  );
}
