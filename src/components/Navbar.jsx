import { useState } from "react";
import "../styles/navbar.css";
import { useLang } from "../context/useLang";
import content from "../data/content";
import { Link } from "react-router-dom";

// Mismo orden que content[lang].nav
const NAV_PATHS = ["/#about", "/#skills", "/#projects", "/#contact", "/lab"];

function Navbar() {
  const { lang, toggleLang } = useLang();
  const t = content[lang].nav;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo" onClick={closeMenu}>
        jfigueroa<span>.dev</span>
      </Link>
      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        {NAV_PATHS.map((path, i) => (
          <li key={path}>
            <Link to={path} onClick={closeMenu}>
              // {t[i]}
            </Link>
          </li>
        ))}
      </ul>
      <div className="nav-right">
        <button className="lang-btn" onClick={toggleLang}>
          {lang === "en" ? "ES" : "EN"}
        </button>
        <button className="hamburger" onClick={toggleMenu}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
