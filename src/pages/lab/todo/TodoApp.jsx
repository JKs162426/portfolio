import { useReducer, useEffect, useState } from "react";
import { todoReducer, sanitizeTasks } from "./todoReducer";
import TodoInput from "./TodoInput";
import TodoList from "./TodoList";
import TodoFooter from "./TodoFooter";
import { readStorage, writeStorage } from "../../../hooks/useLocalStorage";
import { useLang } from "../../../context/useLang";
import content from "../../../data/content";
import "../../../styles/todo.css";

const STORAGE_KEY = "lab-todo-tasks";

const FILTERS = {
  all: () => true,
  active: (task) => !task.completed,
  completed: (task) => task.completed,
};

export default function TodoApp() {
  const { lang } = useLang();
  const t = content[lang].todo;

  const [tasks, dispatch] = useReducer(todoReducer, [], () =>
    sanitizeTasks(readStorage(STORAGE_KEY, []))
  );
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    writeStorage(STORAGE_KEY, tasks);
  }, [tasks]);

  const visibleTasks = tasks.filter(FILTERS[filter]);
  const activeCount = tasks.filter(FILTERS.active).length;
  const completedCount = tasks.length - activeCount;

  return (
    <section className="todo-app">
      <div className="todo-header">
        <div className="todo-label">{t.label}</div>
        <h1 className="todo-title">
          {t.title}
          <span className="todo-accent">.</span>
        </h1>
        <p className="todo-sub">{t.sub}</p>
      </div>

      <div className="todo-card">
        <TodoInput
          t={t}
          hasTasks={tasks.length > 0}
          allDone={tasks.length > 0 && activeCount === 0}
          onAdd={(text) => dispatch({ type: "ADD", payload: text })}
          onToggleAll={() => dispatch({ type: "TOGGLE_ALL" })}
        />
        <TodoList
          t={t}
          tasks={visibleTasks}
          emptyText={t.empty[filter]}
          onToggle={(id) => dispatch({ type: "TOGGLE", payload: id })}
          onEdit={(id, text) => dispatch({ type: "EDIT", payload: { id, text } })}
          onDelete={(id) => dispatch({ type: "DELETE", payload: id })}
        />
        {tasks.length > 0 && (
          <TodoFooter
            t={t}
            filters={Object.keys(FILTERS)}
            filter={filter}
            activeCount={activeCount}
            completedCount={completedCount}
            onFilter={setFilter}
            onClear={() => dispatch({ type: "CLEAR_COMPLETED" })}
          />
        )}
      </div>
    </section>
  );
}
