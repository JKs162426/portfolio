import { useFootball } from "./footballContext";
import { errorMessage, formatTime } from "./format";

export function SkeletonList({ rows = 5, variant = "card" }) {
  return (
    <div className={`fb-skeleton-list fb-skeleton-${variant}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="fb-skeleton" key={i} />
      ))}
    </div>
  );
}

export function Loading({ rows, variant }) {
  const { t } = useFootball();
  return (
    <div role="status">
      <span className="fb-sr-only">{t.states.loading}</span>
      <SkeletonList rows={rows} variant={variant} />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useFootball();
  return (
    <div className="fb-state fb-state-error" role="alert">
      <p className="fb-state-title">{t.errors.title}</p>
      <p className="fb-state-hint">{errorMessage(t, error)}</p>
      {onRetry && (
        <button type="button" className="fb-btn" onClick={onRetry}>
          ↻ {t.states.retry}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, children }) {
  return (
    <div className="fb-state">
      <p className="fb-state-title">{title}</p>
      {hint && <p className="fb-state-hint">{hint}</p>}
      {children}
    </div>
  );
}

// Línea de "actualizado a las…" con botón de recarga, o aviso de datos viejos
export function DataNotice({ resource }) {
  const { t, locale } = useFootball();
  if (!resource.fetchedAt) return null;
  const time = formatTime(resource.fetchedAt, locale);
  const loading = resource.status === "loading";

  return (
    <div className={`fb-notice ${resource.stale ? "stale" : ""}`}>
      <span>{resource.stale ? t.states.stale(time) : t.states.updated(time)}</span>
      <button
        type="button"
        className="fb-link-btn"
        onClick={resource.retry}
        disabled={loading}
      >
        <span className={loading ? "fb-spin" : ""} aria-hidden="true">↻</span>{" "}
        {t.states.refresh}
      </button>
    </div>
  );
}
