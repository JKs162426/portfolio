import '../styles/contact.css'
import { useLang } from '../context/LanguageContext'
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
          <div className="contact-links">
            <a href="mailto:jesus20jk@gmail.com" className="btn-primary">{t.email}</a>
            <a href="https://github.com/JKs162426" target="_blank" className="btn-outline">{t.github}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
