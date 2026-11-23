import '../styles/about.css'
import { useLang } from '../context/useLang'
import content from '../data/content'
import { featured, more } from '../data/projects'
import useIntersect from '../hooks/useIntersect'

const projects = [...featured, ...more]

// El total de proyectos y clientes se calcula desde los datos de proyectos.
// Los textos y cifras restantes están definidos en content[lang].about.stats.
const STATS = [
  { key: 'projects', value: String(projects.length) },
  { key: 'clients', value: String(projects.filter((p) => p.badge === 'client').length) },
  { key: 'hackathon', value: '2026' },
  { key: 'languages', value: 'ES · EN' },
]

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
          </div>
          {/* dt antes que dd: el lector de pantalla dice "Proyectos publicados, 7" */}
          <dl className="about-stats">
            {STATS.map(({ key, value }) => {
              const { label, detail, spoken } = t.stats[key]
              return (
                <div className="stat-card" key={key}>
                  <dt className="stat-label">{label}</dt>
                  <dd className="stat-num">
                    {spoken ? (
                      <>
                        <span aria-hidden="true">{value}</span>
                        <span className="sr-only">{spoken}</span>
                      </>
                    ) : (
                      value
                    )}
                  </dd>
                  <dd className="stat-detail">{detail}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </section>
  )
}

export default About
