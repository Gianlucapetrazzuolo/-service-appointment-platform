import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/types/domain';

export function useAdminLocations() {
  return useQuery<Location[]>({
    queryKey: ['locations', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface LocationInput {
  id?: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  is_active: boolean;
  sort_order: number;
}

export function useSaveLocation() {
  const qc = useQueryClient();
  return useMutation<Location, Error, LocationInput>({
    mutationFn: async ({ id, ...fields }) => {
      const query = id
        ? supabase.from('locations').update(fields).eq('id', id).select().single()
        : supabase.from('locations').insert(fields).select().single();
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          throw new Error('Questa sede ha prenotazioni collegate: disattivala invece di eliminarla.');
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
