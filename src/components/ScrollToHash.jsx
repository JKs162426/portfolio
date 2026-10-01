import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // Sin hash (p. ej. al entrar a /lab/todo) volvemos arriba
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [pathname, hash, key]);

  return null;
}

export default ScrollToHash;
