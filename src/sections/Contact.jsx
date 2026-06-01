import '../styles/contact.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

function Contact() {
  const { lang } = useLang()
  const t = content[lang].contact

  return (
    <section className="contact" id="contact">
      <div className="section-label">{t.label}</div>
      <div className="contact-inner">
        <h2 className="contact-title">{t.title}</h2>
        <p className="contact-sub">{t.sub}</p>
        <div className="contact-links">
          <a href="mailto:your@email.com" className="btn-primary">{t.email}</a>
          <a href="https://github.com/" target="_blank" className="btn-outline">{t.github}</a>
        </div>
      </div>
    </section>
  )
}

export default Contact
