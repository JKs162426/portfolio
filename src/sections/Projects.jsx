import '../styles/projects.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

const projects = [
  {
    id: '01',
    title: 'Project Alpha',
    desc: 'A fullstack web application with user authentication, REST API, and PostgreSQL backend.',
    tags: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    github: '#',
    live: null,
  },
  {
    id: '02',
    title: 'Project Beta',
    desc: 'RESTful API service with JWT auth, CRUD operations, and clean endpoint design.',
    tags: ['Node.js', 'Express', 'REST API', 'JWT'],
    github: '#',
    live: null,
  },
  {
    id: '03',
    title: 'Project Gamma',
    desc: 'Frontend React app with component architecture, state management, and responsive design.',
    tags: ['React', 'JavaScript', 'CSS', 'API'],
    github: '#',
    live: null,
  },
]

function Projects() {
  const { lang } = useLang()
  const t = content[lang].projects

  return (
    <section className="projects" id="projects">
      <div className="section-label">{t.label}</div>
      <h2 className="section-title">{t.title}</h2>
      <div className="projects-grid">
        {projects.map(project => (
          <div className="project-card" key={project.id}>
            <div className="project-num">project_{project.id}</div>
            <h3 className="project-title">{project.title}</h3>
            <p className="project-desc">{project.desc}</p>
            <div className="project-tags">
              {project.tags.map(tag => (
                <span className="project-tag" key={tag}>{tag}</span>
              ))}
            </div>
            <div className="project-links">
              <a href={project.github} className="project-link">{t.github}</a>
              {project.live && (
                <a href={project.live} className="project-link">{t.live}</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Projects
