import { useEffect } from 'react';
import type { BrandTheme } from '@/brand.config';
import { applyBrand } from '@/theme/applyBrand';
import { useSettings } from './queries';

/**
 * Applica a runtime il tema brand salvato nel DB (`settings.theme`) e aggiorna
 * il titolo della pagina con il nome dell'attività. Va montato una sola volta.
 */
export function BrandingEffect() {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!settings) return;
    applyBrand(settings.theme as BrandTheme);
    if (settings.business_name) {
      document.title = settings.business_name;
    }
  }, [settings]);

  return null;
}
