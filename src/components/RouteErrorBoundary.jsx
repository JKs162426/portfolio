import { Component } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "../context/useLang";
import content from "../data/content";
import StatusPage from "./StatusPage";

// Tras un despliegue cambian los nombres de los chunks: una pestaña abierta
// con la versión anterior falla al cargar una página lazy
function isChunkError(error) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError/i.test(
    error?.message ?? ""
  );
}

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const t = this.props.texts;
    const chunk = isChunkError(error);
    return (
      <StatusPage
        code={chunk ? "↻" : "500"}
        title={chunk ? t.updateTitle : t.title}
        text={chunk ? t.updateText : t.text}
      >
        <button type="button" className="status-btn primary" onClick={() => window.location.reload()}>
          {t.reload}
        </button>
        {/* Enlace normal (no Link): fuerza una carga limpia de la app */}
        <a href="/" className="status-btn">
          {t.home}
        </a>
      </StatusPage>
    );
  }
}

// La key por ruta reinicia el boundary al navegar a otra página
function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  const { lang } = useLang();

  return (
    <ErrorBoundary key={pathname} texts={content[lang].routeError}>
      {children}
    </ErrorBoundary>
  );
}

export default RouteErrorBoundary;
