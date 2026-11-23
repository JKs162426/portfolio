// Límite de peticiones en el cliente (ventana deslizante). Va por delante de
// la API: si alguien recorre carreras y pilotos muy rápido, la app deja de
// pedir y avisa, en vez de gastar el cupo público de Jolpica.

export interface RateLimiter {
  /** 0 si la petición puede salir (y la cuenta); si no, ms hasta que quede un hueco */
  take(): number;
}

export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const sent: number[] = [];

  return {
    take() {
      const t = now();
      while (sent.length > 0 && t - sent[0]! >= windowMs) sent.shift();
      if (sent.length >= limit) return sent[0]! + windowMs - t;
      sent.push(t);
      return 0;
    },
  };
}
