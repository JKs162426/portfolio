import '../styles/skills.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

const skills = [
  { name: 'React', color: 'accent' },
  { name: 'Node.js', color: 'green' },
  { name: 'Express', color: 'green' },
  { name: 'PostgreSQL', color: 'purple' },
  { name: 'JavaScript', color: 'accent' },
  { name: 'REST APIs', color: 'accent' },
  { name: 'Git / GitHub', color: 'purple' },
  { name: 'HTML / CSS', color: 'accent' },
  { name: 'SQL', color: 'purple' },
  { name: 'Tailwind CSS', color: 'accent' },
]

function Skills() {
  const { lang } = useLang()
  const t = content[lang].skills

  return (
    <section className="skills" id="skills">
      <div className="section-label">{t.label}</div>
      <h2 className="section-title">{t.title}</h2>
      <div className="skills-grid">
        {skills.map(skill => (
          <div className="skill-chip" key={skill.name}>
            <span className={`skill-dot ${skill.color}`} />
            {skill.name}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
