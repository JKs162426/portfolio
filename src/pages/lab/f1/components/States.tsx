import type { ReactNode } from "react";
import { useF1 } from "../context/f1Context";
import { errorMessage, formatTime } from "../lib/format";
import type { ResourceState } from "../hooks/useF1Resource";

export function Loading({ rows = 6 }: { rows?: number }) {
  const { t } = useF1();
  return (
    <div role="status">
      <span className="f1-sr-only">{t.states.loading}</span>
      <div className="f1-skeleton-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div className="f1-skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useF1();
  return (
    <div className="f1-state f1-state-error" role="alert">
      <p className="f1-state-title">{t.errors.title}</p>
      <p className="f1-state-hint">{errorMessage(t, error)}</p>
      {onRetry && (
        <button type="button" className="f1-btn" onClick={onRetry}>
          ↻ {t.states.retry}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="f1-state">
      <p className="f1-state-title">{title}</p>
    </div>
  );
}

// "Actualizado a las…" con botón de recarga, o aviso de datos guardados
export function DataNotice({ resource }: { resource: ResourceState<unknown> }) {
  const { t, locale } = useF1();
  if (!resource.fetchedAt) return null;
  const time = formatTime(resource.fetchedAt, locale);
  const loading = resource.status === "loading";

  return (
    <div className={`f1-notice ${resource.stale ? "stale" : ""}`}>
      <span>{resource.stale ? t.states.stale(time) : t.states.updated(time)}</span>
      <button type="button" className="f1-link-btn" onClick={resource.retry} disabled={loading}>
        <span className={loading ? "f1-spin" : ""} aria-hidden="true">
          ↻
        </span>{" "}
        {t.states.refresh}
      </button>
    </div>
  );
}

/**
 * Muestra carga, error o vacío; si hay datos, llama a children(data).
 * Con datos viejos y un error al recargar se siguen mostrando los datos.
 */
export function ResourceView<T>({
  resource,
  isEmpty,
  emptyText,
  rows,
  children,
}: {
  resource: ResourceState<T>;
  isEmpty: (data: T) => boolean;
  emptyText: string;
  rows?: number;
  children: (data: T) => ReactNode;
}) {
  if (resource.data === null) {
    if (resource.status === "error") return <ErrorState error={resource.error} onRetry={resource.retry} />;
    return <Loading rows={rows} />;
  }
  if (isEmpty(resource.data)) return <EmptyState title={emptyText} />;
  return <>{children(resource.data)}</>;
}
