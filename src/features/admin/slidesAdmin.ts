import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { HomeSlide } from '@/types/domain';
import type { Database } from '@/types/database.types';

type SlideUpdate = Database['public']['Tables']['home_slides']['Update'];

/** Tutte le slide (anche disattivate) — solo admin via RLS. */
export function useAdminSlides() {
  return useQuery<HomeSlide[]>({
    queryKey: ['home_slides', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface SlideInput {
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
}

export function useCreateSlide() {
  const qc = useQueryClient();
  return useMutation<HomeSlide, Error, SlideInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.from('home_slides').insert(input).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_slides'] }),
  });
}

export function useUpdateSlide() {
  const qc = useQueryClient();
  return useMutation<HomeSlide, Error, { id: string; patch: SlideUpdate }>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('home_slides')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_slides'] }),
  });
}

export function useDeleteSlide() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('home_slides').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_slides'] }),
  });
}

/** Scambia l'ordine di due slide (riordino su/giù). */
export function useSwapSlideOrder() {
  const qc = useQueryClient();
  return useMutation<void, Error, { a: HomeSlide; b: HomeSlide }>({
    mutationFn: async ({ a, b }) => {
      const { error: e1 } = await supabase
        .from('home_slides')
        .update({ sort_order: b.sort_order })
        .eq('id', a.id);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase
        .from('home_slides')
        .update({ sort_order: a.sort_order })
        .eq('id', b.id);
      if (e2) throw new Error(e2.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_slides'] }),
  });
}
