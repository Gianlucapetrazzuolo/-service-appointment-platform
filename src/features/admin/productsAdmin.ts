import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/domain';

/** Tutti i prodotti (anche disattivati) — solo admin via RLS. */
export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ProductInput {
  id?: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, ProductInput>({
    mutationFn: async ({ id, ...fields }) => {
      const query = id
        ? supabase.from('products').update(fields).eq('id', id).select().single()
        : supabase.from('products').insert(fields).select().single();
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
