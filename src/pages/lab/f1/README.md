# Pit Wall — Fórmula 1 (lab)

Mini app del portafolio para consultar la Fórmula 1 de **cualquier temporada
desde 1950**: calendario, resultados de carrera, sprint y clasificación,
campeonato de pilotos y de constructores, y la temporada de cada piloto.
Ruta: **`/lab/f1`**. Bilingüe ES/EN. Escrita en **TypeScript**.

Datos: [Jolpica-F1](https://github.com/jolpica/jolpica-f1), la sucesora pública
de la API Ergast. No necesita key.

## Puesta en marcha

```
npm run dev        → http://localhost:5173/lab/f1
npm run typecheck  → tsc (solo el código TS)
npm test
```

No hay variables de entorno. En Vercel, `api/f1.ts` se despliega solo como
función serverless.

## Arquitectura

```
navegador ──► /api/f1?path=2026/driverstandings ──► api.jolpi.ca/ergast/f1/…json?limit=100
              (proxy con lista blanca + caché CDN)
```

Aunque la API es pública, las peticiones pasan por un proxy propio
(`api/f1.ts`, también montado en `vite dev`/`vite preview` desde
`vite.config.js`):

- **Lista blanca:** solo acepta estas rutas, y solo temporadas de 1950 a la
  actual:

  | Ruta | Para qué |
  |---|---|
  | `{año}/races` | calendario y horarios de cada sesión |
  | `{año}/results/1` | ganador de cada carrera (una sola petición) |
  | `{año}/driverstandings` · `{año}/constructorstandings` | campeonatos |
  | `{año}/{ronda}/results` · `/sprint` · `/qualifying` | resultados de un GP |
  | `{año}/drivers/{id}/results` | temporada de un piloto |

  Y exactamente un parámetro (`path`): cualquier extra crearía otra entrada de
  caché que llegaría a la API.
- **Caché en la CDN de Vercel**, compartida entre todos los visitantes:
  10 min para la temporada actual y 1 día para las terminadas (no cambian).
- **CSP intacta:** el navegador solo habla con el propio dominio
  (`connect-src 'self'`).

`api/f1.ts` es autocontenido a propósito: Vercel compila cada función por
separado y un import relativo sin extensión fallaría en ESM. Por eso
`MIN_SEASON` está también en `lib/seasons.ts` (un test comprueba que coinciden).

### Límite de peticiones

Jolpica permite unas 4 peticiones por segundo y 500 por hora. Para no
acercarse:

1. **Caché local** (`localStorage`, prefijo `f1:v1:`): calendario 6 h,
   campeonatos y resultados 10 min; temporadas terminadas, 1 día.
2. **Límite en el cliente** (`lib/rateLimit.ts`): ventana deslizante de
   **20 peticiones reales por minuto** por pestaña (las que salen de la caché no
   cuentan). Al pasarlo, la app no llama a la red: muestra "inténtalo en N s",
   o los datos guardados con un aviso si los hay.
3. **Peticiones compartidas:** dos componentes que piden lo mismo a la vez
   comparten una sola petición.
4. **Todo bajo demanda:** entrar gasta 2 peticiones (calendario + ganadores);
   cada pestaña, carrera o piloto abierto, 1 más. La pestaña de clasificación o
   sprint de un GP solo se pide al abrirla.
5. Un **429** de la API se reenvía con su `Retry-After` y no se cachea.

## Estado y navegación

Temporada, vista y modal abierto viven en la URL
(`?season=2008&view=drivers&driver=hamilton`, `?round=5`). Así se pueden
compartir y "Atrás" funciona. Los modales se encadenan (carrera → piloto →
carrera): "Atrás" retrocede uno y "Cerrar" vuelve a la lista de una vez
(el historial guarda la profundidad en `location.state.modalDepth`).
Los parámetros inválidos se ignoran.

## Estructura

```
api/f1.ts                 proxy (Vercel + Vite) · tests en api/_lib/f1.test.ts

src/pages/lab/f1/
  F1App.tsx               punto de entrada: URL ↔ estado, pestañas, modales
  i18n.ts                 textos ES/EN; `es` está tipado con la forma de `en`
  views/                  RaceCalendar · DriverStandings · ConstructorStandings
                          RaceDetails (modal) · DriverDetails (modal)
  components/             Modal accesible · States · SeasonSelect · TeamMark
  context/f1Context.ts    temporada, textos y acciones (abrir carrera/piloto)
  hooks/useF1Resource.ts  carga un recurso: status, data, error, stale, retry
  lib/                    sin React: se prueba sin navegador
    types.ts              forma de la API (Raw*) y forma normalizada
    api.ts                recursos, TTL, caché, límite, errores tipados
    normalize.ts          respuestas → forma estable (tolera datos antiguos)
    rateLimit.ts          ventana deslizante
    utils.ts              estado de cada carrera, resumen de un piloto, diferencias
    format.ts · seasons.ts · teams.ts
  styles/f1.css           prefijo f1-, variables globales del portafolio
  __tests__/              Vitest + Testing Library, con datos de ejemplo reales
```

Regla de dependencias: `views` → `components` → `context`/`hooks` → `lib`.

## Particularidades de los datos

- **Doblados:** en temporadas recientes la API marca `Lapped` y manda un
  "tiempo" que no es la diferencia con el ganador. La app muestra "+1 vuelta"
  calculado con las vueltas del ganador (`lapsDown`).
- **Pit lane:** `grid: 0` significa salida desde el pit lane.
- **Medios puntos:** existen (carreras acortadas); se muestran con un decimal.
- **Temporadas antiguas:** sin horarios, sin código de piloto ni dorsal. El
  campeonato de constructores empieza en 1958.
- **Puntos del piloto en el modal:** suman solo carreras (sin sprint); el total
  del campeonato está en la cabecera.
- **Colores de equipo:** aproximados, solo para la parrilla 2026
  (`lib/teams.ts`); los equipos históricos usan un gris neutro.

## Tests

- `api/_lib/f1.test.ts`: lista blanca, temporadas, parámetros, cabeceras de caché, 429, timeout.
- `__tests__/normalize.test.ts`: respuestas completas, antiguas, vacías y rotas.
- `__tests__/api.test.ts`: caché y caducidad, peticiones compartidas, datos viejos ante fallo, límite de 20/min.
- `__tests__/utils.test.ts`: estado de carreras, resumen de piloto, temporadas, rate limiter.
- `__tests__/F1App.test.tsx`: flujos en jsdom — calendario, abrir carrera y cambiar de sesión,
  carrera futura sin peticiones, piloto → carrera → cerrar, constructores, cambio de temporada,
  URL inválida, error + reintento, español.
