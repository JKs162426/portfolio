import { Link } from "react-router-dom";
import "../styles/projects.css";
import { useLang } from "../context/useLang";
import content from "../data/content";
import useIntersect from "../hooks/useIntersect";

// Las descripciones (traducidas) están en content[lang].projects.items[key]
const projects = [
  {
    id: "01",
    key: "glossia",
    title: "Glossia",
    tags: ["React", "Node.js", "Express", "PostgreSQL"],
    github: "https://github.com/JKs162426/glossia",
    live: "https://glossia-v2.onrender.com",
  },
  {
    id: "02",
    key: "dankar",
    title: "Detalles DanKar",
    tags: ["React", "Node.js", "Express", "MongoDB", "JWT", "Cloudinary"],
    github: "https://github.com/JKs162426/danikar",
    live: "https://dankar.vercel.app",
  },
  {
    id: "03",
    key: "matchday",
    title: "Matchday",
    tags: ["React", "React Router", "Vercel Functions", "REST API", "Vitest"],
    github: "https://github.com/JKs162426/portfolio/tree/main/src/pages/lab/football",
    // Ruta interna: se navega con el router, sin recargar la página
    live: "/lab/football",
  },
];

function Projects() {
  const { lang } = useLang();
  const t = content[lang].projects;
  const ref = useIntersect();

  return (
    <section className="projects" id="projects">
      <div className="fade-in" ref={ref}>
        <div className="section-label">{t.label}</div>
        <h2 className="section-title">{t.title}</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-num">project_{project.id}</div>
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
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="project-link"
                >
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
