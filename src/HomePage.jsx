import Hero from "./sections/Hero";
import About from "./sections/About";
import HowIWork from "./sections/HowIWork";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import Contact from "./sections/Contact";

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <HowIWork />
      <Skills />
      <Projects />
      <Contact />
    </>
  );
}

export default HomePage;
