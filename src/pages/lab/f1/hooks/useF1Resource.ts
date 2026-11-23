import { useCallback, useEffect, useState } from "react";
import { fetchResource, type Resource } from "../lib/api";

export type ResourceStatus = "idle" | "loading" | "success" | "error";

export interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
  error: unknown;
  stale: boolean;
  fetchedAt: number | null;
  retry: () => void;
}

interface Result<T> {
  key: string | null;
  path: string | null;
  data?: T | null;
  fetchedAt?: number;
  stale?: boolean;
  error?: unknown;
}

/**
 * Carga un recurso (ver `resources` en lib/api.ts). `resource` debe ser
 * estable entre renders: los recursos están memorizados por ruta. null = no cargar.
 */
export function useF1Resource<T>(resource: Resource<T> | null): ResourceState<T> {
  const path = resource?.path ?? null;
  // Reintentos por recurso: >0 se salta la caché local
  const [reloads, setReloads] = useState<Record<string, number>>({});
  const reloadCount = path ? (reloads[path] ?? 0) : 0;
  const requestKey = `${path}#${reloadCount}`;

  const [result, setResult] = useState<Result<T>>({ key: null, path: null });

  useEffect(() => {
    if (!resource) return;
    let active = true;

    fetchResource(resource, { force: reloadCount > 0 })
      .then(({ data, fetchedAt, stale }) => {
        if (active) setResult({ key: requestKey, path: resource.path, data, fetchedAt, stale, error: null });
      })
      .catch((error: unknown) => {
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

  let status: ResourceStatus = "loading";
  if (!resource) status = "idle";
  else if (isCurrent) status = result.error ? "error" : "success";

  return {
    status,
    data: samePath ? (result.data ?? null) : null,
    error: isCurrent ? result.error : null,
    stale: samePath && Boolean(result.stale),
    fetchedAt: samePath ? (result.fetchedAt ?? null) : null,
    retry,
  };
}
