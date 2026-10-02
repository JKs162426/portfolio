import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo '' → carga también variables sin VITE_, que nunca llegan al cliente
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), footballApi(env.FOOTBALL_DATA_API_KEY)],
    test: {
      include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
    },
  }
})
