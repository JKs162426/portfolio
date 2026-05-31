import '../styles/skills.css'

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
  { name: 'Python', color: 'accent' },
]

function Skills() {
  return (
    <section className="skills" id="skills">
      <div className="section-label">02 // skills</div>
      <h2 className="section-title">Tech I work with</h2>
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
