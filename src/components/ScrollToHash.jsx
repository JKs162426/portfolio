import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;

    if (hash) {
      const el = document.querySelector(hash);
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
