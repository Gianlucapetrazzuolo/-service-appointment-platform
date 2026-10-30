import { brandConfig } from '@/brand.config';
import { useSettings } from './queries';

/**
 * Risolve il branding effettivo combinando i default build-time
 * (`brand.config.ts`) con le impostazioni salvate nel DB (`settings`).
 * Selettore puro: nessun effetto collaterale (vedi BrandingEffect per quelli).
 */
export function useBranding() {
  const { data: settings } = useSettings();
  return {
    businessName: settings?.business_name?.trim() || brandConfig.name,
    tagline: brandConfig.tagline,
    logoUrl: settings?.logo_url || brandConfig.logoUrl,
  };
}
