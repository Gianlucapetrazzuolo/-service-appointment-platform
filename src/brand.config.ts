/**
 * Configurazione del brand a build-time.
 *
 * Questi sono i default mostrati prima che l'app legga le impostazioni dal DB.
 * Per personalizzare un nuovo cliente in modo "statico" basta modificare qui;
 * per la personalizzazione "live" (senza rebuild) si usa la tabella `settings`
 * letta da `applyBrand()` in `src/theme/applyBrand.ts`.
 *
 * I colori sono in formato canali RGB ("R G B") per coerenza con `index.css`.
 */
export interface BrandTheme {
  /** Token colore in formato "R G B" (es. "79 70 229"). */
  colors?: Partial<Record<BrandColorToken, string>>;
  fonts?: {
    sans?: string;
    display?: string;
  };
  radius?: string;
}

export type BrandColorToken =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'primary'
  | 'primary-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'destructive-foreground';

export interface BrandConfig {
  /** Nome attività mostrato di default (sovrascrivibile da `settings`). */
  name: string;
  tagline: string;
  /** URL logo di fallback (può essere sovrascritto da `settings.logo_url`). */
  logoUrl: string | null;
  theme: BrandTheme;
}

export const brandConfig: BrandConfig = {
  name: 'Prenota Online',
  tagline: 'Cura, stile ed eleganza. Prenota il tuo momento.',
  logoUrl: null,
  theme: {
    // Vuoto = usa i default già presenti in index.css.
    // Esempio per ribrandizzare:
    // colors: { primary: '13 148 136', accent: '244 114 182' },
    colors: {},
  },
};
