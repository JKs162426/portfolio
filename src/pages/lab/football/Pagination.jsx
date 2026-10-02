import { useFootball } from "./footballContext";

export default function Pagination({ page, pageCount, onChange }) {
  const { t } = useFootball();
  if (pageCount <= 1) return null;

  return (
    <nav className="fb-pagination" aria-label={t.pagination.label}>
      <button
        type="button"
        className="fb-icon-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t.pagination.prev}
      >
        ←
      </button>
      <span className="fb-pagination-label" aria-live="polite">
        {t.pagination.page(page, pageCount)}
      </span>
      <button
        type="button"
        className="fb-icon-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t.pagination.next}
      >
        →
      </button>
    </nav>
  );
}
