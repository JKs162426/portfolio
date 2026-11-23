import { Link } from "react-router-dom";
import { useLang } from "../../context/useLang";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import caseStudies from "../../data/caseStudies";
import content from "../../data/content";
import { featured, more } from "../../data/projects";
import "../../styles/case-study.css";

const projects = [...featured, ...more];

// Caso de estudio de un proyecto: los textos están en data/caseStudies.js
export default function CaseStudy({ projectKey }) {
  const { lang } = useLang();
  const project = projects.find((p) => p.key === projectKey);
  const ui = caseStudies[lang].ui;
  const study = caseStudies[lang][projectKey];
  const badges = content[lang].projects.badges;
  useDocumentTitle(`${project.title} · ${ui.label} | Jesus Figueroa`);

  return (
    <article className="case">
      <Link to="/#projects" className="case-back">
        {ui.back}
      </Link>

      <header className="case-header">
        <div className="case-label">
          {ui.label}
          {project.badge && <span className="case-badge">{badges[project.badge]}</span>}
        </div>
        <h1 className="case-title">
          {project.title}
          <span className="case-accent">.</span>
        </h1>
        <p className="case-intro">{study.intro}</p>
        <div className="case-links">
          <a href={project.live} target="_blank" rel="noreferrer" className="btn-primary">
            {ui.live}
          </a>
          <a href={project.github} target="_blank" rel="noreferrer" className="btn-outline">
            {ui.github}
          </a>
        </div>
      </header>

      <img
        className="case-shot"
        src={`/projects/${projectKey}-case.webp`}
        alt={ui.shotAlt(project.title)}
        width="1280"
        height="800"
      />

      <dl className="case-facts" aria-label={ui.facts}>
        {study.facts.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="case-tags" aria-label="Stack">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      {study.sections.map((section) => (
        <section className="case-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {section.items && (
            <ol className="case-items">
              {section.items.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {study.testimonial && (
        <figure className="case-quote">
          <blockquote>
            <p>{study.testimonial.quote}</p>
          </blockquote>
          <figcaption>{study.testimonial.author}</figcaption>
        </figure>
      )}

      <footer className="case-footer">
        <Link to="/#projects" className="case-back">
          {ui.back}
        </Link>
      </footer>
    </article>
  );
}
