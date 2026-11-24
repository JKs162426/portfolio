import '../styles/contact.css'
import { useLang } from '../context/useLang'
import content from '../data/content'
import useIntersect from '../hooks/useIntersect'

function Contact() {
  const { lang } = useLang()
  const t = content[lang].contact
  const ref = useIntersect()

  return (
    <section className="contact" id="contact">
      <div className="fade-in" ref={ref}>
        <div className="section-label">{t.label}</div>
        <div className="contact-inner">
          <h2 className="contact-title">{t.title}</h2>
          <p className="contact-sub">{t.sub}</p>
          <p className="contact-location">{t.location}</p>
          <div className="contact-links">
            <a href="mailto:jesus20jk@gmail.com" className="btn-primary">{t.email}</a>
            <a href="https://www.linkedin.com/in/jesusmfr93" target="_blank" rel="noreferrer" className="btn-outline">
              {t.linkedin}
            </a>
            <a href="https://github.com/JKs162426" target="_blank" rel="noreferrer" className="btn-outline">
              {t.github}
            </a>
            <a href="/cv.pdf" download className="btn-outline">{t.cv}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
