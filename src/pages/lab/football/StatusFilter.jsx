import { useFootball } from "./footballContext";
import { STATUS_FILTERS } from "./utils";

export default function StatusFilter({ value, onChange }) {
  const { t } = useFootball();

  return (
    <div className="fb-chips" role="group" aria-label={t.statusFilter}>
      {STATUS_FILTERS.map((name) => (
        <button
          key={name}
          type="button"
          className={`fb-chip fb-chip-${name} ${value === name ? "active" : ""}`}
          aria-pressed={value === name}
          onClick={() => onChange(name)}
        >
          {t.status[name]}
        </button>
      ))}
    </div>
  );
}
