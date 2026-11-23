import "../styles/how-i-work.css";
import { useLang } from "../context/useLang";
import content from "../data/content";

function HowIWork() {
  const { lang } = useLang();
  const t = content[lang].approach;

  return (
    <section className="approach" id="approach">
      <div className="approach-inner">
        <div className="section-label">{t.label}</div>
        <h2 className="section-title">{t.title}</h2>
        <ol className="approach-steps">
          {t.steps.map((step, index) => (
            <li className="approach-step" key={step.title}>
              <span className="approach-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowIWork;
