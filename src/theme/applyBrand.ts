import type { BrandTheme } from '@/brand.config';

/**
 * Applica un tema brand iniettando le CSS custom properties su <html>.
 * Permette di ri-brandizzare l'app a runtime (es. leggendo `settings.theme`
 * dal database) senza ricompilare.
 */
export function applyBrand(theme: BrandTheme | null | undefined): void {
  if (!theme) return;
  const root = document.documentElement;

  if (theme.colors) {
    for (const [token, value] of Object.entries(theme.colors)) {
      if (value) root.style.setProperty(`--color-${token}`, value);
    }
  }
  if (theme.fonts?.sans) root.style.setProperty('--font-sans', theme.fonts.sans);
  if (theme.fonts?.display) root.style.setProperty('--font-display', theme.fonts.display);
  if (theme.radius) root.style.setProperty('--radius', theme.radius);
}
