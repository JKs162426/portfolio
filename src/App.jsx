import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ScrollToHash from "./components/ScrollToHash";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import NotFound from "./components/NotFound";
import { useLang } from "./context/useLang";
import content from "./data/content";

// Las páginas del lab se cargan bajo demanda: no pesan en la home
const LabIndex = lazy(() => import("./pages/lab/LabIndex"));
const TodoApp = lazy(() => import("./pages/lab/todo/TodoApp"));
const FootballApp = lazy(() => import("./pages/lab/football/FootballApp"));

function App() {
  const { lang } = useLang();

  return (
    <BrowserRouter>
      <Navbar />
      <ScrollToHash />
      <RouteErrorBoundary>
        <Suspense
          fallback={
            <div style={{ minHeight: "100vh", paddingTop: "8rem", textAlign: "center" }}>
              {content[lang].loading}
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lab" element={<LabIndex />} />
            <Route path="/lab/todo" element={<TodoApp />} />
            <Route path="/lab/football" element={<FootballApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
