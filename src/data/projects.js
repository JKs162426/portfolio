// Los textos (traducidos) están en content[lang].projects: impact[key] para los
// puntos de la tarjeta ({ label, text }, los mismos en los dos idiomas),
// badges[badge] para la etiqueta y notes[key] para avisos.
// badge: "client" (cliente real) · "concept" (proyecto de concepto) · "team"
// · "hackathon" (NASA Space Apps)
export const featured = [
  {
    key: "dankar",
    title: "Detalles DanKar",
    badge: "client",
    tags: ["React", "Node.js", "Express", "MongoDB", "Zod", "Cloudinary", "Vision AI"],
    github: "https://github.com/JKs162426/danikar",
    live: "https://dankar.vercel.app",
  },
  {
    key: "accanto",
    title: "Accanto",
    badge: "concept",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Zod", "Tailwind CSS"],
    github: "https://github.com/JKs162426/accanto",
    live: "https://accanto-psi.vercel.app",
  },
  {
    key: "matchday",
    title: "Matchday",
    tags: ["React", "React Router", "Vercel Functions", "REST API", "Vitest"],
    github: "https://github.com/JKs162426/portfolio/tree/main/src/pages/lab/football",
    // Ruta interna: se navega con el router, sin recargar la página
    live: "/lab/football",
  },
  {
    key: "glossia",
    title: "Glossia",
    tags: ["React", "Express", "MySQL", "Google OAuth"],
    github: "https://github.com/JKs162426/glossia-v2",
    live: "https://glossia-v2.onrender.com",
  },
];

export const more = [
  {
    key: "lunar",
    title: "Lunar Landing Site Navigator",
    badge: "hackathon",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Recharts", "astronomy-engine", "Vitest"],
    github: "https://github.com/JKs162426/lunar-landing-site-navigator",
    live: "https://lunar-landing-site-navigator-indol.vercel.app",
  },
  {
    key: "gymlog",
    title: "GymLog",
    badge: "team",
    tags: ["Next.js", "TypeScript", "MongoDB", "NextAuth"],
    github: "https://github.com/JKs162426/gymlog",
    live: "https://gymlog-beige.vercel.app",
  },
  {
    key: "sacrament",
    title: "Sacrament Meeting Program",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Auth.js", "Zod"],
    github: "https://github.com/JKs162426/sacrament-meetings",
    live: "https://sacrament-meetings-weld.vercel.app",
  },
];
