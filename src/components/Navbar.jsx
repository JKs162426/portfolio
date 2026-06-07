import { useState } from 'react'
import '../styles/navbar.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

function Navbar() {
  const { lang, toggleLang } = useLang()
  const t = content[lang].nav
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(prev => !prev)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="nav">
      <div className="nav-logo">
        jesus<span>.dev</span>
      </div>
      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li><a href="#about" onClick={closeMenu}>// {t[0]}</a></li>
        <li><a href="#skills" onClick={closeMenu}>// {t[1]}</a></li>
        <li><a href="#projects" onClick={closeMenu}>// {t[2]}</a></li>
        <li><a href="#contact" onClick={closeMenu}>// {t[3]}</a></li>
      </ul>
      <div className="nav-right">
        <button className="lang-btn" onClick={toggleLang}>
          {lang === 'en' ? 'ES' : 'EN'}
        </button>
        <button className="hamburger" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
