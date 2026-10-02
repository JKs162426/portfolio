import { Link } from "react-router-dom";
import { useLang } from "../../context/useLang";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import content from "../../data/content";
import "../../styles/lab.css";

// Añade aquí cada experimento nuevo (los textos van en content[lang].lab)
const LAB_PROJECTS = [
  { key: "football", path: "/lab/football", tags: ["React Router", "REST API", "Cache", "a11y"] },
  { key: "todo", path: "/lab/todo", tags: ["useReducer", "localStorage"] },
];

export default function LabIndex() {
  const { lang } = useLang();
  const t = content[lang].lab;
  useDocumentTitle(`${t.title} | Jesus Figueroa`);

  return (
    <section className="lab-index">
      <div className="lab-label">{t.label}</div>
      <h1 className="lab-title">
        {t.title}
        <span className="lab-accent">.</span>
      </h1>
      <p className="lab-sub">{t.sub}</p>

      <ul className="lab-grid">
        {LAB_PROJECTS.map(({ key, path, tags }, i) => (
          <li key={key}>
            <Link to={path} className="lab-card">
              <span className="lab-card-num">exp_{String(i + 1).padStart(2, "0")}</span>
              <span className="lab-card-title">{t.projects[key].title}</span>
              <span className="lab-card-desc">{t.projects[key].desc}</span>
              <span className="lab-card-tags">
                {tags.map((tag) => (
                  <span key={tag} className="lab-tag">
                    {tag}
                  </span>
                ))}
              </span>
              <span className="lab-card-open">{t.open}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
