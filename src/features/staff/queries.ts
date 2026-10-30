import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Staff } from '@/types/domain';

/** Operatori attivi (lettura pubblica), opzionalmente filtrati per sede. */
export function useStaff(locationId: string | null) {
  return useQuery<Staff[]>({
    queryKey: ['staff', 'active', locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('location_id', locationId!)
        .order('sort_order', { ascending: true })
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
