import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { HomeSlide } from '@/types/domain';

/** Slide attive del carosello home, ordinate. Lettura pubblica. */
export function useSlides() {
  return useQuery<HomeSlide[]>({
    queryKey: ['home_slides', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
