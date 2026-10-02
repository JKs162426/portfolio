import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ScrollToHash from "./components/ScrollToHash";
import { useLang } from "./context/useLang";
import content from "./data/content";

const TodoApp = lazy(() => import("./pages/lab/todo/TodoApp"));

function App() {
  const { lang } = useLang();

  return (
    <BrowserRouter>
      <Navbar />
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/lab/todo"
          element={
            <Suspense
              fallback={
                <div style={{ minHeight: "100vh", paddingTop: "8rem", textAlign: "center" }}>
                  {content[lang].todo.loading}
                </div>
              }
            >
              <TodoApp />
            </Suspense>
          }
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
