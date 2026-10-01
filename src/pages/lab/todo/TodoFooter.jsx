export default function TodoFooter({
  t,
  filters,
  filter,
  activeCount,
  completedCount,
  onFilter,
  onClear,
}) {
  return (
    <div className="todo-footer">
      <span className="todo-count">{t.left(activeCount)}</span>

      <div className="todo-filters" role="group">
        {filters.map((name) => (
          <button
            key={name}
            className={`todo-filter ${filter === name ? "active" : ""}`}
            onClick={() => onFilter(name)}
            aria-pressed={filter === name}
          >
            {t.filters[name]}
          </button>
        ))}
      </div>

      <button
        className="todo-clear"
        onClick={onClear}
        disabled={completedCount === 0}
      >
        {t.clear}
      </button>
    </div>
  );
}
