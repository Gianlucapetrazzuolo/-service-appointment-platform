import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/domain';

/** Prodotti attivi della vetrina (sola lettura per i clienti). */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
