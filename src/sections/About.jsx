import '../styles/about.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'
import useIntersect from '../hooks/useIntersect'

function About() {
  const { lang } = useLang()
  const t = content[lang].about
  const ref = useIntersect()

  return (
    <section className="about" id="about">
      <div className="fade-in" ref={ref}>
        <div className="section-label">{t.label}</div>
        <h2 className="section-title">{t.title}</h2>
        <div className="about-grid">
          <div className="about-text">
            <p>{t.p1}</p>
            <p>{t.p2}</p>
            <p>
              {t.p3}{' '}
              <strong className="accent-text">HobbyHub</strong>{' '}
              {t.p3b}
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <span className="stat-num">1+</span>
              <span className="stat-label">{t.stats[0]}</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">JS</span>
              <span className="stat-label">{t.stats[1]}</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">BYU-I</span>
              <span className="stat-label">{t.stats[2]}</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">∞</span>
              <span className="stat-label">{t.stats[3]}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
