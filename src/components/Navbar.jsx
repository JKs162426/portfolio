import '../styles/navbar.css'

function Navbar() {
    return (
        <nav className="nav">
            <div className="nav-logo">
                Jesus<span>.dev</span>
            </div>
            <ul className="nav-links">
                <li><a href="#about">// about</a></li>
                <li><a href="#skills">// skills</a></li>
                <li><a href="#projects">// projects</a></li>
                <li><a href="#contact">// contact</a></li>
            </ul>
        </nav>
    )
}

export default Navbar