# Matchday — Premier League (lab)

Mini app del portafolio para consultar la Premier League: clasificación,
partidos por equipo y mes, partidos por día y detalle de cada partido.
Ruta: **`/lab/football`**. Bilingüe ES/EN (usa el idioma del portafolio).

## Puesta en marcha

1. Pide una API key gratuita en <https://www.football-data.org/client/register>.
2. Copia `.env.example` como `.env.local` en la raíz y rellena:
   ```
   FOOTBALL_DATA_API_KEY=tu_key
   ```
   (`.env.local` ya está en `.gitignore`).
3. `npm run dev` → <http://localhost:5173/lab/football>

**En Vercel:** Project Settings → Environment Variables → `FOOTBALL_DATA_API_KEY`.
No hace falta nada más: `api/football.js` se despliega como función serverless
y `vercel.json` redirige las rutas del SPA a `index.html`.

## Arquitectura

```
navegador ──► /api/football?path=…  ──► api.football-data.org/v4
              (proxy con la key)
```

La key **nunca llega al navegador**: football-data.org bloquea CORS y una
variable `VITE_*` quedaría expuesta en el bundle. El mismo proxy
(`api/_lib/footballProxy.js`) se usa en Vercel (`api/football.js`) y en
`vite dev`/`vite preview` (plugin en `vite.config.js`). Solo acepta una lista
blanca de rutas para no convertirse en un proxy abierto.

### Estrategia de datos (límite: 10 peticiones/min en el plan gratuito)

- Al entrar se hacen **2 peticiones**: clasificación y todos los partidos de
  la temporada. Las vistas (por equipo, por día, filtros, búsqueda) filtran
  en el cliente, sin más peticiones.
- El detalle de un partido hace 1 petición al abrirlo.
- **Caché en `localStorage`** con marca de tiempo (`football:v1:*`):
  clasificación 10 min, partidos 5 min (1 min si hay alguno en vivo),
  detalle 30 min (1 min si está en vivo).
- Si una petición falla y hay caché vieja, se muestra con un aviso
  (“datos guardados a las…”) en vez de un error.
- Peticiones simultáneas al mismo recurso se comparten.
- La CDN de Vercel cachea las respuestas 60 s (`s-maxage`) para todos los visitantes.

### Estado y navegación

Vista, equipo, mes, fecha, estado, página y partido abierto viven en la URL
(`?view=team&team=57&month=2026-10&match=123`). Así:
- “Atrás” vuelve a la vista anterior y cierra el modal.
- El detalle es un modal: la lista de debajo no se desmonta, no se pierde el scroll.
- Cualquier vista se puede compartir por enlace.

La búsqueda es estado local (con debounce de 300 ms) y no ensucia el historial.

## Estructura

```
api/
  football.js                 función serverless de Vercel
  _lib/footballProxy.js       proxy compartido (Vercel + Vite)
src/hooks/
  useFootballData.js          carga un recurso: status, data, error, stale, retry
  useDebounce.js
  useDocumentTitle.js
src/pages/lab/football/
  FootballApp.jsx             componente principal: URL ↔ estado, pestañas, modal
  FootballProvider.jsx        contexto con clasificación + partidos (evita prop drilling)
  footballContext.js          createContext + useFootball()
  api.js                      cliente: recursos, caché, errores tipados
  normalize.js                respuestas de la API → forma estable
  utils.js                    búsqueda, filtros, fechas, paginación, orden (funciones puras)
  format.js                   fechas y mensajes de error traducidos
  SearchBar.jsx               combobox accesible con sugerencias
  LeagueTable.jsx             clasificación ordenable, filtrable por la búsqueda
  MatchesByTeam.jsx           partidos de un equipo por mes (o temporada completa)
  MatchesByDay.jsx            partidos de un día + filtro de equipo y estado
  MatchDetails.jsx            modal de detalle (marcador, goles, alineaciones, stats)
  MatchList.jsx / MatchCard.jsx / Pagination.jsx / StatusFilter.jsx / TeamCrest.jsx
  States.jsx                  skeletons, error con reintento, vacío, aviso de datos
src/styles/football.css       estilos (variables globales del portafolio, prefijo fb-)
```

Los textos están en `src/data/content.js` → `football` (ES y EN).

## Qué trae la API (plan gratuito) y qué no

| Dato | Disponible |
|---|---|
| Clasificación (pos, PJ, G, E, P, GF, GC, Pts) | ✅ |
| Partidos de la temporada: fecha, estado, marcador final y al descanso, jornada, árbitro | ✅ |
| Escudos de los equipos | ✅ |
| Goleadores, alineaciones, suplentes, estadísticas | ❌ requiere plan de pago — la app los muestra si llegan y si no, lo explica |
| Marcador en vivo minuto a minuto | ⚠️ con retraso en el plan gratuito |
| Temporadas anteriores | ❌ no implementado (v1 = temporada actual) |

## Tests

```
npm test
```

- `utils.test.js`: búsqueda, filtros combinados, navegación por fechas, paginación, orden.
- `normalize.test.js`: respuestas completas, vacías e incompletas.
- `api.test.js`: caché, caducidad, peticiones compartidas, datos viejos ante fallo, errores.
- `FootballApp.test.jsx`: flujos en jsdom — tabla por defecto, buscar → elegir equipo →
  abrir/cerrar partido, cambio de mes y filtro, vista por día, error + reintento.
- `api/_lib/footballProxy.test.js`: lista blanca, key ausente, 429, caída de la API.

## Ideas para v2 (fuera del alcance actual)

Más ligas (el proxy y `RESOURCES` ya están parametrizados por ruta), temporadas
anteriores, goleadores (`/competitions/PL/scorers`), pronósticos.
