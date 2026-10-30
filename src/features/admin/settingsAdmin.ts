import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/types/domain';

export type SettingsPatch = Partial<
  Pick<
    Settings,
    | 'business_name'
    | 'timezone'
    | 'slot_step_min'
    | 'min_notice_min'
    | 'max_advance_days'
    | 'logo_url'
    | 'theme'
    | 'address'
    | 'phone'
    | 'email'
    | 'about_description'
    | 'about_history'
    | 'socials'
  >
>;

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<Settings, Error, SettingsPatch>({
    mutationFn: async (patch) => {
      const { data, error } = await supabase
        .from('settings')
        .update(patch)
        .eq('id', true)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
