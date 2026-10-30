import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/domain';

/** Servizi attivi, ordinati come decide l'admin (sort_order, poi nome). */
export function useServices() {
  return useQuery<Service[]>({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Singolo servizio attivo per id (usato dal flusso di prenotazione). */
export function useService(serviceId: string | null) {
  return useQuery<Service | null>({
    queryKey: ['services', 'one', serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
