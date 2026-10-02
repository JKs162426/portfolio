import { useEffect, useRef } from "react";

/**
 * Llama a `refresh` cada `interval` ms mientras `active` sea true y la
 * pestaña esté visible. Al volver a la pestaña refresca enseguida.
 */
export function useLivePolling(active, refresh, interval = 60_000) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    let id = null;

    const start = () => {
      if (id === null) id = setInterval(() => refreshRef.current(), interval);
    };
    const stop = () => {
      clearInterval(id);
      id = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refreshRef.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, interval]);
}
