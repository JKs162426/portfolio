import '../styles/navbar.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

function Navbar() {
  const { lang, toggleLang } = useLang()
  const t = content[lang].nav

  return (
    <nav className="nav">
      <div className="nav-logo">
        jesus<span>.dev</span>
      </div>
      <ul className="nav-links">
        <li><a href="#about">// {t[0]}</a></li>
        <li><a href="#skills">// {t[1]}</a></li>
        <li><a href="#projects">// {t[2]}</a></li>
        <li><a href="#contact">// {t[3]}</a></li>
      </ul>
      <button className="lang-btn" onClick={toggleLang}>
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
    </nav>
  )
}

export default Navbar
