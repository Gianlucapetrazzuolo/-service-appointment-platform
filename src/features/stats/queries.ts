import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AdminStats } from '@/types/domain';

/**
 * Statistiche aggregate (solo admin), opzionalmente filtrate per sede
 * (`locationId` null = tutte le sedi). I dati sono calcolati lato server.
 */
export function useAdminStats(locationId: string | null = null) {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats', locationId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats', { p_location_id: locationId });
      if (error) throw new Error(error.message);
      return data as AdminStats;
    },
  });
}
