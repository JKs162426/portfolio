import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;

    if (hash) {
      // El hash viene de la URL: con querySelector, "#123" o "#a[b" lanzan
      // SyntaxError y, como este componente está fuera del error boundary,
      // tumbarían la app. getElementById acepta cualquier texto.
      let el = null;
      try {
        el = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        // Hash con escapes inválidos (#%E0%A4%A): se ignora
      }
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    // Solo al cambiar de página: los cambios de ?query (filtros del lab)
    // no deben mandar al usuario arriba
    if (pathChanged) window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return null;
}

export default ScrollToHash;
