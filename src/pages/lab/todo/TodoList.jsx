import TodoItem from "./TodoItem";

export default function TodoList({ t, tasks, emptyText, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="todo-empty">{emptyText}</p>;
  }

  return (
    <ul className="todo-list">
      {tasks.map((task) => (
        <TodoItem
          key={task.id}
          t={t}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
