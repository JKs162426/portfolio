import { useRef, useState } from "react";

export default function TodoItem({ t, task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const cancelled = useRef(false);

  function startEditing() {
    cancelled.current = false;
    setDraft(task.text);
    setEditing(true);
  }

  // Enter y Escape terminan en blur, así el guardado ocurre en un solo sitio
  function handleBlur() {
    setEditing(false);
    if (cancelled.current) return;
    const trimmed = draft.trim();
    // Dejar el texto vacío equivale a borrar la tarea
    if (trimmed === "") onDelete(task.id);
    else if (trimmed !== task.text) onEdit(task.id, trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") cancelled.current = true;
    if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
  }

  const className = [
    "todo-item",
    task.completed && "completed",
    editing && "editing",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={className}>
      <label className="todo-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
        <span className="todo-checkmark" aria-hidden="true" />
      </label>

      {editing ? (
        <input
          className="todo-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          maxLength={200}
          autoFocus
        />
      ) : (
        <span
          className="todo-text"
          onDoubleClick={startEditing}
          title={t.editHint}
        >
          {task.text}
        </span>
      )}

      {!editing && (
        <div className="todo-actions">
          <button
            className="todo-icon-btn"
            onClick={startEditing}
            aria-label={t.edit}
            title={t.edit}
          >
            ✎
          </button>
          <button
            className="todo-icon-btn danger"
            onClick={() => onDelete(task.id)}
            aria-label={t.delete}
            title={t.delete}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}
