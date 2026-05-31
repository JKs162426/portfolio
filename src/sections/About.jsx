import '../styles/about.css'

function About() {
  return (
    <section className="about" id="about">
      <div className="section-label">01 // about</div>
      <h2 className="section-title">Who I am</h2>
      <div className="about-grid">
        <div className="about-text">
          <p>
            I'm a fullstack JavaScript developer and CS student based in Idaho.
            Before diving into software, I was an English teacher in Venezuela —
            which gave me a methodical, structured way of thinking about problems
            that carries directly into how I write code.
          </p>
          <p>
            I've been building for over a year, working with the full JS stack:
            React on the frontend, Node/Express on the backend, and PostgreSQL
            for data. Every project so far has been built with real-world patterns
            in mind — authentication, REST APIs, relational databases.
          </p>
          <p>
            Currently working on{' '}
            <strong className="accent-text">HobbyHub</strong>{' '}
            — a platform for people to share their interests and connect with others.
          </p>
        </div>
        <div className="about-stats">
          <div className="stat-card">
            <span className="stat-num">1+</span>
            <span className="stat-label">Years building</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">JS</span>
            <span className="stat-label">Primary stack</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">BYU-I</span>
            <span className="stat-label">CS degree</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">∞</span>
            <span className="stat-label">Learning mode</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
