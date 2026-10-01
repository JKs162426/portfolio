import { useState } from "react";

export default function TodoInput({ t, hasTasks, allDone, onAdd, onToggleAll }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "") return; // evita tareas vacías
    onAdd(trimmed);
    setText("");
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <button
        type="button"
        className={`todo-toggle-all ${allDone ? "active" : ""}`}
        onClick={onToggleAll}
        disabled={!hasTasks}
        aria-label={t.toggleAll}
        title={t.toggleAll}
      >
        ✓
      </button>
      <input
        className="todo-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.placeholder}
        aria-label={t.placeholder}
        maxLength={200}
        autoFocus
      />
      <button type="submit" className="todo-add" disabled={text.trim() === ""}>
        {t.add}
      </button>
    </form>
  );
}
