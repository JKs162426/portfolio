import { useEffect } from 'react'
import { LanguageContext } from './useLang'
import { useLocalStorage } from '../hooks/useLocalStorage'

const LANGS = ['en', 'es']

export function LanguageProvider({ children }) {
  // Se recuerda entre visitas; un valor guardado inválido vuelve a inglés
  const [stored, setLang] = useLocalStorage('lang', 'en')
  const lang = LANGS.includes(stored) ? stored : 'en'

  const toggleLang = () => setLang(lang === 'en' ? 'es' : 'en')

  // Lectores de pantalla y buscadores usan el atributo lang del documento
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}
