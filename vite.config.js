import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { handleFootballRequest } from './api/_lib/footballProxy.js'

// En local no existen las funciones de Vercel: montamos el mismo proxy
// como middleware de Vite (dev y preview)
function footballApi(apiKey) {
  // Sin return: si configureServer devuelve una función, Vite la ejecuta
  const mount = (server) => {
    server.middlewares.use('/api/football', (req, res) =>
      handleFootballRequest(req, res, apiKey)
    )
  }
  return {
    name: 'football-api',
    configureServer: mount,
    configurePreviewServer: mount,
  }
}

// Vercel sirve dist/404.html con estado 404 para las rutas que no existen.
// Es una copia de index.html: la app arranca y muestra su página NotFound,
// pero buscadores y enlaces reciben un 404 real en vez de un 200.
function notFoundPage() {
  let outDir
  return {
    name: 'not-found-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo '' → carga también variables sin VITE_, que nunca llegan al cliente
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), footballApi(env.FOOTBALL_DATA_API_KEY), notFoundPage()],
    test: {
      include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
    },
  }
})
