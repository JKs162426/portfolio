import '../styles/contact.css'

function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="section-label">04 // contact</div>
      <div className="contact-inner">
        <h2 className="contact-title">Let's build something.</h2>
        <p className="contact-sub">
          Open to opportunities, collaborations, and interesting problems.
        </p>
        <div className="contact-links">
          <a href="mailto:your@email.com" className="btn-primary">↗ Email me</a>
          <a href="https://github.com/" target="_blank" className="btn-outline">↗ GitHub</a>
        </div>
      </div>
    </section>
  )
}

export default Contact
