import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/types/domain';

/** Sedi attive (lettura pubblica), ordinate. */
export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ['locations', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
