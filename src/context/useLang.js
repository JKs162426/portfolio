import { createContext, useContext } from 'react'

export const LanguageContext = createContext()

export function useLang() {
  return useContext(LanguageContext)
}
