import { useState, useEffect } from 'react'
import '../styles/hero.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

function Hero() {
  const { lang } = useLang()
  const t = content[lang].hero
  const [typed, setTyped] = useState('')
  const fullName = 'Jesus'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTyped(fullName.slice(0, i + 1))
      i++
      if (i >= fullName.length) clearInterval(interval)
    }, 120)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero" id="home">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-content">
        <div className="hero-tag">{t.tag}</div>
        <h1 className="hero-name">
          {typed}<span className="accent">.</span>
          <span className="cursor-blink" />
        </h1>
        <p className="hero-role">
          <span className="highlight">React · Node.js · PostgreSQL</span>
          {' '}—{' '}{t.role.split('—')[1]}
        </p>
        <p className="hero-desc">{t.desc}</p>
        <div className="hero-cta">
          <a href="#projects" className="btn-primary">{t.cta1}</a>
          <a href="#contact" className="btn-outline">{t.cta2}</a>
          <a href="/cv.pdf" download className='btn-outline'>{t.cta3}</a>
        </div>
      </div>
    </section>
  )
}

export default Hero
