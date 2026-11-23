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
              (proxy: validación + caché CDN)
```

### ¿Por qué un proxy, si la API es pública?

Jolpica no necesita key y admite CORS (`access-control-allow-origin: *`): el
navegador **podría llamarla directo**. El proxy (`api/f1.ts`, también montado en
`vite dev`/`vite preview` desde `vite.config.js`) **no es por seguridad**. Es por
estas razones:

1. **Caché compartida.** Sin proxy, cada visitante descarga lo mismo por su
   cuenta. Con proxy, la CDN de Vercel guarda la respuesta para todos: una
   temporada terminada llega a Jolpica, como mucho, una vez al día por región.
   Jolpica la mantienen voluntarios (≈4 peticiones/s, 500/hora): la idea es
   usarla lo menos posible.
2. **Independencia del proveedor.** Ergast cerró en 2024 y hubo que migrar. Si
   cambia la API, se toca `api/f1.ts`; el navegador sigue llamando a `/api/f1`.
3. **Control y CSP.** Solo se sirven las consultas que usa la app, y el
   navegador solo habla con el propio dominio (`connect-src 'self'`).

**Costes asumidos:** un salto más de red, una pieza más que puede fallar (si
Vercel cae, la app cae aunque Jolpica funcione) y que todos los visitantes
comparten el cupo por IP de Vercel en vez de tener cada uno el suyo. Ese último
punto solo importa si alguien consigue esquivar la caché; las capas de abajo
existen para que no pueda.

**Alternativa descartada:** llamar directo a Jolpica desde el navegador, con la
caché local y el límite del cliente. Es más simple, pero cada visitante gasta
sus propias peticiones y no hay caché compartida.

### Capas de validación del proxy

Una caché compartida solo protege si las URLs posibles son pocas: si se puede
inventar una URL nueva en cada petición, cada una llega a la API. Por eso:

| Capa | Qué rechaza | Coste |
|---|---|---|
| 1. Un solo parámetro (`path`) | `?path=…&x=1`: otra clave de caché para lo mismo | nada (400) |
| 2. Forma de la ruta | rutas fuera de la lista, temporadas fuera de 1950–actual, rondas > 30, ceros a la izquierda | nada (400) |
| 3. Índice de la temporada | rondas y pilotos que no existen en esa temporada | nada tras la 1.ª petición de la temporada (404, cacheado 1 h en la CDN) |
| 4. Respeto al 429 | tras un 429, no se llama a Jolpica hasta que pase su `Retry-After` | nada (429) |
| 5. Límite por IP (Firewall de Vercel) | más de **60 peticiones por minuto desde una misma IP** a `/api/f1` | nada: se corta antes de la CDN y de la función (429) |

Rutas permitidas:

| Ruta | Para qué |
|---|---|
| `{año}/races` | calendario y horarios de cada sesión |
| `{año}/results/1` | ganador de cada carrera (una sola petición) |
| `{año}/driverstandings` · `{año}/constructorstandings` | campeonatos |
| `{año}/{ronda}/results` · `/sprint` · `/qualifying` | resultados de un GP |
| `{año}/drivers/{id}/results` | temporada de un piloto |

**El índice** (capa 3) son las rondas y los pilotos de cada temporada
(`{año}/races` y `{año}/drivers`, paginado: 1952 y 1953 tienen más de 100
pilotos por la Indy 500). Se guarda en la memoria de la función: 10 min la
temporada actual (puede debutar un piloto) y 1 día las terminadas. Si falla no
se guarda, y la siguiente petición lo reintenta.

**Resultado:** en toda la historia hay unas **7.000 URLs válidas**
(77 × 4 de temporada + 1.172 carreras × 3 sesiones + unas 3.000 parejas
piloto-temporada), y casi todas salen de la CDN. Quien las recorriera todas de
golpe tendría que hacerlo desde muchas IPs (capa 5); y si aun así llegara al
límite por hora de Jolpica (500), la capa 4 deja de insistir y la CDN sigue
sirviendo lo que ya tiene.

**Límite por IP (capa 5).** No está en el código: un contador en memoria no
sería fiable con varias instancias de la función. Es una regla del Firewall de
Vercel (`Rate limit /api/f1`: ruta que empieza por `/api/f1`, ventana fija de
60 s, clave = IP, 60 peticiones). 60 es el triple del límite del cliente
(20/min por pestaña): deja margen para varias pestañas o varias personas tras
la misma IP (una oficina, una universidad) y frena a un bot. Al pasarse, Vercel
responde `429 Too Many Requests` en texto y sin `Retry-After`; el cliente lo
trata como "inténtalo en 60 s". El plan Hobby incluye 3 reglas y 1 millón de
peticiones evaluadas al mes.

Para verla o cambiarla:

```
vercel firewall rules list --project portfolio
vercel firewall rules inspect "Rate limit /api/f1" --project portfolio
```

`api/f1.ts` es autocontenido a propósito: Vercel compila cada función por
separado y un import relativo sin extensión fallaría en ESM. Por eso
`MIN_SEASON` está también en `lib/seasons.ts` (un test comprueba que coinciden).

### Límite de peticiones en el cliente

1. **Caché local** (`localStorage`, prefijo `f1:v1:`): calendario 6 h,
   campeonatos y resultados 10 min; temporadas terminadas, 1 día.
2. **Límite** (`lib/rateLimit.ts`): ventana deslizante de **20 peticiones
   reales por minuto** por pestaña (las que salen de la caché no cuentan). Al
   pasarlo, la app no llama a la red: muestra "inténtalo en N s", o los datos
   guardados con un aviso si los hay.
3. **Peticiones compartidas:** dos componentes que piden lo mismo a la vez
   comparten una sola petición.
4. **Todo bajo demanda:** entrar gasta 2 peticiones (calendario + ganadores);
   cada pestaña, carrera o piloto abierto, 1 más. La pestaña de clasificación o
   sprint de un GP solo se pide al abrirla.
5. Un **404** del proxy (ronda o piloto que no existen) se muestra como "sin
   resultados", no como error, y no se tapa con datos viejos.

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

- `api/_lib/f1.test.ts`: lista blanca, temporadas, parámetros, índice de rondas y pilotos (con paginación,
  reutilización y renovación), cabeceras de caché, 404, 429 y espera tras 429, timeout.
- `__tests__/normalize.test.ts`: respuestas completas, antiguas, vacías y rotas.
- `__tests__/api.test.ts`: caché y caducidad, peticiones compartidas, datos viejos ante fallo, 404, 429 del
  Firewall (texto, sin `Retry-After`), límite de 20/min.
- `__tests__/utils.test.ts`: estado de carreras, resumen de piloto, temporadas, rate limiter.
- `__tests__/F1App.test.tsx`: flujos en jsdom — calendario, abrir carrera y cambiar de sesión,
  carrera futura sin peticiones, piloto → carrera → cerrar, constructores, cambio de temporada,
  URL inválida, piloto que no corrió esa temporada, error + reintento, español.
