import { createContext, useContext } from "react";

// Datos compartidos por todas las vistas (ver FootballProvider.jsx)
export const FootballContext = createContext(null);

export function useFootball() {
  return useContext(FootballContext);
}
