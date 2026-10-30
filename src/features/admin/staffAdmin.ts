import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Staff } from '@/types/domain';

export function useAdminStaff() {
  return useQuery<Staff[]>({
    queryKey: ['staff', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface StaffInput {
  id?: string;
  location_id: string;
  full_name: string;
  is_active: boolean;
  sort_order: number;
}

export function useSaveStaff() {
  const qc = useQueryClient();
  return useMutation<Staff, Error, StaffInput>({
    mutationFn: async ({ id, ...fields }) => {
      const query = id
        ? supabase.from('staff').update(fields).eq('id', id).select().single()
        : supabase.from('staff').insert(fields).select().single();
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          throw new Error('Questo operatore ha prenotazioni collegate: disattivalo invece di eliminarlo.');
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
