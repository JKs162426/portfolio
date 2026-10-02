import { useEffect } from "react";

// Cambia el título de la pestaña y restaura el anterior al salir de la página
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
