// Descarta datos corruptos o de versiones anteriores en localStorage
export function sanitizeTasks(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.text === "string" &&
      typeof task.completed === "boolean"
  );
}

export function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.payload,
          completed: false,
          createdAt: Date.now(),
        },
      ];

    case "TOGGLE":
      return state.map((task) =>
        task.id === action.payload
          ? { ...task, completed: !task.completed }
          : task
      );

    case "EDIT":
      return state.map((task) =>
        task.id === action.payload.id
          ? { ...task, text: action.payload.text }
          : task
      );

    case "DELETE":
      return state.filter((task) => task.id !== action.payload);

    case "TOGGLE_ALL": {
      const allDone = state.every((task) => task.completed);
      return state.map((task) => ({ ...task, completed: !allDone }));
    }

    case "CLEAR_COMPLETED":
      return state.filter((task) => !task.completed);

    default:
      return state;
  }
}
