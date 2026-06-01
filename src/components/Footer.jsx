import '../styles/contact.css'
import { useLang } from '../context/LanguageContext'
import content from '../data/content'

function Footer() {
  const { lang } = useLang()
  const t = content[lang].footer

  return (
    <footer className="footer">
      <span className="footer-text">{t.left} <span className="accent-text">Jesus</span></span>
      <span className="footer-text">{t.right}</span>
    </footer>
  )
}

export default Footer
