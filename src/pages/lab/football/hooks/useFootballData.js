import { useCallback, useEffect, useState } from "react";
import { fetchResource } from "../lib/api";

/**
 * Carga un recurso de la API de fútbol (ver getLeagueResources / matchResource en api.js).
 * `resource` debe ser estable entre renders (constante de módulo o useMemo).
 *
 * Devuelve { status, data, error, stale, fetchedAt, retry }
 * status: "idle" | "loading" | "success" | "error"
 */
export function useFootballData(resource) {
  const path = resource?.path ?? null;
  // Contador de reintentos por recurso: >0 fuerza saltarse la caché
  const [reloads, setReloads] = useState({});
  const reloadCount = path ? reloads[path] ?? 0 : 0;
  const requestKey = `${path}#${reloadCount}`;

  const [result, setResult] = useState({ key: null, path: null });

  useEffect(() => {
    if (!resource) return;
    let active = true;

    fetchResource(resource, { force: reloadCount > 0 })
      .then(({ data, fetchedAt, stale }) => {
        if (active) setResult({ key: requestKey, path: resource.path, data, fetchedAt, stale, error: null });
      })
      .catch((error) => {
        if (active) setResult({ key: requestKey, path: resource.path, data: null, error });
      });

    return () => {
      active = false;
    };
  }, [resource, reloadCount, requestKey]);

  const retry = useCallback(() => {
    if (path) setReloads((r) => ({ ...r, [path]: (r[path] ?? 0) + 1 }));
  }, [path]);

  const isCurrent = result.key === requestKey;
  // Al reintentar se siguen mostrando los datos anteriores del mismo recurso
  const samePath = result.path === path;

  let status = "loading";
  if (!resource) status = "idle";
  else if (isCurrent) status = result.error ? "error" : "success";

  return {
    status,
    data: samePath ? result.data ?? null : null,
    error: isCurrent ? result.error : null,
    stale: samePath && Boolean(result.stale),
    fetchedAt: samePath ? result.fetchedAt ?? null : null,
    retry,
  };
}
