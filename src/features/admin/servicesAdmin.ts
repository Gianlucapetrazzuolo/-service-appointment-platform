import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/domain';

/** Tutti i servizi (anche disattivati) — visibile solo agli admin via RLS. */
export function useAdminServices() {
  return useQuery<Service[]>({
    queryKey: ['services', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ServiceInput {
  id?: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
  is_package: boolean;
  description_long: string | null;
  image_url: string | null;
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation<Service, Error, ServiceInput>({
    mutationFn: async ({ id, ...fields }) => {
      const query = id
        ? supabase.from('services').update(fields).eq('id', id).select().single()
        : supabase.from('services').insert(fields).select().single();
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) {
        // FK restrict: il servizio ha prenotazioni collegate.
        if (error.code === '23503') {
          throw new Error(
            'Questo servizio ha prenotazioni collegate: disattivalo invece di eliminarlo.',
          );
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
