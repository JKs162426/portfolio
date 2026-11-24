import { createContext, useContext } from "react";
import type { Messages } from "../i18n";

export interface F1ContextValue {
  season: number;
  t: Messages;
  locale: string;
  openRace: (round: number) => void;
  openDriver: (driverId: string) => void;
}

export const F1Context = createContext<F1ContextValue | null>(null);

export function useF1(): F1ContextValue {
  const value = useContext(F1Context);
  if (!value) throw new Error("useF1 debe usarse dentro de <F1Context.Provider>");
  return value;
}
