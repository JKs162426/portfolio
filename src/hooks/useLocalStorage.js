import { useState, useEffect } from "react";

export function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Modo privado o cuota llena: seguimos sin persistir
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
