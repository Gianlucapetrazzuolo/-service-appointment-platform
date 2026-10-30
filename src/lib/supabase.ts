import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Variabili Supabase mancanti. Copia `.env.example` in `.env` e imposta ' +
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  );
}

/** Client Supabase tipizzato, singleton per tutta l'app. */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
