import "../styles/status-page.css";

// Página genérica para 404 y errores: código, título, texto y acciones
function StatusPage({ code, title, text, children }) {
  return (
    <section className="status-page">
      <div className="status-code">{code}</div>
      <h1 className="status-title">{title}</h1>
      <p className="status-text">{text}</p>
      <div className="status-actions">{children}</div>
    </section>
  );
}

export default StatusPage;
