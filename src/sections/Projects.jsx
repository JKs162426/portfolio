import { Link } from "react-router-dom";
import "../styles/projects.css";
import { useLang } from "../context/useLang";
import content from "../data/content";
import useIntersect from "../hooks/useIntersect";
import { featured, more } from "../data/projects";

function ProjectCard({ project, number, t, compact = false }) {
  const note = t.notes[project.key];

  return (
    <article className={`project-card ${compact ? "compact" : ""}`}>
      <div className="project-meta">
        <span className="project-num">project_{number}</span>
        {project.badge && (
          <span className={`project-badge project-badge-${project.badge}`}>
            {t.badges[project.badge]}
          </span>
        )}
      </div>
      <h3 className="project-title">{project.title}</h3>
      <p className="project-desc">{t.items[project.key]}</p>
      <div className="project-tags">
        {project.tags.map((tag) => (
          <span className="project-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="project-links">
        <a href={project.github} target="_blank" rel="noreferrer" className="project-link">
          {t.github}
        </a>
        {project.live?.startsWith("/") ? (
          <Link to={project.live} className="project-link">
            {t.live}
          </Link>
        ) : (
          project.live && (
            <a href={project.live} target="_blank" rel="noreferrer" className="project-link">
              {t.live}
            </a>
          )
        )}
      </div>
      {note && <p className="project-note">{note}</p>}
    </article>
  );
}

function Projects() {
  const { lang } = useLang();
  const t = content[lang].projects;
  const ref = useIntersect();
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section className="projects" id="projects">
      <div className="fade-in" ref={ref}>
        <div className="section-label">{t.label}</div>
        <h2 className="section-title">{t.title}</h2>
        <div className="projects-grid">
          {featured.map((project, i) => (
            <ProjectCard key={project.key} project={project} number={pad(i + 1)} t={t} />
          ))}
        </div>

        <h3 className="projects-subtitle">{t.moreTitle}</h3>
        <div className="projects-grid">
          {more.map((project, i) => (
            <ProjectCard
              key={project.key}
              project={project}
              number={pad(featured.length + i + 1)}
              t={t}
              compact
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
