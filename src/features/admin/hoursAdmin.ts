import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessHour, Closure } from '@/types/domain';

// --- Orari settimanali --------------------------------------------------------

export function useAdminHours(locationId: string | null) {
  return useQuery<BusinessHour[]>({
    queryKey: ['business_hours', locationId],
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

export interface HourInput {
  weekday: number;
  open_time: string; // "HH:MM"
  close_time: string; // "HH:MM"
  location_id?: string; // se assente → sede di default
}

/** Id della sede di default (prima attiva per ordine). */
async function defaultLocationId(): Promise<string> {
  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Nessuna sede configurata.');
  return data.id;
}

export function useCreateHour() {
  const qc = useQueryClient();
  return useMutation<BusinessHour, Error, HourInput>({
    mutationFn: async (input) => {
      const location_id = input.location_id ?? (await defaultLocationId());
      const { data, error } = await supabase
        .from('business_hours')
        .insert({ weekday: input.weekday, open_time: input.open_time, close_time: input.close_time, location_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_hours'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useUpdateHour() {
  const qc = useQueryClient();
  return useMutation<BusinessHour, Error, { id: string; open_time: string; close_time: string }>({
    mutationFn: async ({ id, open_time, close_time }) => {
      const { data, error } = await supabase
        .from('business_hours')
        .update({ open_time, close_time })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_hours'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteHour() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('business_hours').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_hours'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// --- Chiusure straordinarie ---------------------------------------------------

export function useAdminClosures() {
  return useQuery<Closure[]>({
    queryKey: ['closures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('closures')
        .select('*')
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ClosureInput {
  starts_at: string; // ISO
  ends_at: string; // ISO
  reason: string | null;
  location_id: string | null; // null = tutte le sedi
}

export function useCreateClosure() {
  const qc = useQueryClient();
  return useMutation<Closure, Error, ClosureInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.from('closures').insert(input).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closures'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteClosure() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('closures').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closures'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
