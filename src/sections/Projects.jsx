import '../styles/projects.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'
import useIntersect from '../hooks/useIntersect'

const projects = [
  {
    id: '01',
    title: 'Glossia',
    desc: 'A language learning app with React frontend, Node.js backend, and PostgreSQL database. Features include user auth, flashcards, and progress tracking.',
    tags: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    github: 'https://github.com/JKs162426/glossia',
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
  const ref = useIntersect()

  return (
    <section className="projects" id="projects">
      <div className="fade-in" ref={ref}>
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
                  <a href={project.github} target="_blank" rel="noreferrer" className="project-link">{t.github}</a>
                {project.live && (
                  <a href={project.live} className="project-link">{t.live}</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
