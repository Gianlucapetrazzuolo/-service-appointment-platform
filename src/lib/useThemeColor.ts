import { useEffect, useState } from 'react';

/**
 * Legge un design-token colore (canali RGB) e lo restituisce come stringa
 * `rgb(r g b)` utilizzabile da SVG/Recharts. Rispetta il tema brand corrente.
 */
export function useThemeColor(token: string, fallback = 'rgb(111 78 55)'): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${token}`)
      .trim();
    if (raw) setColor(`rgb(${raw})`);
  }, [token]);
  return color;
}
