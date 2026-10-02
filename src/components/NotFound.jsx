import { Link } from "react-router-dom";
import { useLang } from "../context/useLang";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import content from "../data/content";
import StatusPage from "./StatusPage";

function NotFound() {
  const { lang } = useLang();
  const t = content[lang].notFound;
  useDocumentTitle(`404 | Jesus Figueroa`);

  return (
    <StatusPage code="404" title={t.title} text={t.text}>
      <Link to="/" className="status-btn primary">
        {t.home}
      </Link>
      <Link to="/lab" className="status-btn">
        {t.lab}
      </Link>
    </StatusPage>
  );
}

export default NotFound;
