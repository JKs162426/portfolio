import { useState, useEffect } from 'react'
import '../styles/hero.css'

function Hero() {
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
        <div className="hero-tag">Fullstack Developer</div>
        <h1 className="hero-name">
          {typed}<span className="accent">.</span>
          <span className="cursor-blink" />
        </h1>
        <p className="hero-role">
          <span className="highlight">React · Node.js · PostgreSQL</span>
          {' '}—{' '}Building things that work.
        </p>
        <p className="hero-desc">
          Computer Science student at BYU-Idaho. I build fullstack web 
          applications from the database up to the UI — clean APIs, solid 
          data models, and interfaces people actually want to use.
        </p>
        <div className="hero-cta">
          <a href="#projects" className="btn-primary">View Projects →</a>
          <a href="#contact" className="btn-outline">Get in touch</a>
        </div>
      </div>
    </section>
  )
}

export default Hero
