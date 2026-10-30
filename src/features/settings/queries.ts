import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessHour, Settings } from '@/types/domain';

/** Impostazioni dell'attività (riga singola). Lettura pubblica via RLS. */
export function useSettings() {
  return useQuery<Settings | null>({
    queryKey: ['settings'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Orari di apertura settimanali di una sede, ordinati per giorno e fascia. */
export function useBusinessHours(locationId: string | null) {
  return useQuery<BusinessHour[]>({
    queryKey: ['business_hours', locationId],
    staleTime: 5 * 60 * 1000,
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('location_id', locationId!)
        .order('weekday', { ascending: true })
        .order('open_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
