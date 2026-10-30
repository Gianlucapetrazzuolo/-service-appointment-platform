import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingStatus } from '@/types/domain';

/** Tutte le prenotazioni (admin) ordinate dalla più recente. */
export function useAdminBookings() {
  return useQuery<Booking[]>({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Sposta un appuntamento a un nuovo orario e/o operatore (admin-only). */
export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation<Booking, Error, { id: string; newStartsAt: string; newStaffId?: string | null }>({
    mutationFn: async ({ id, newStartsAt, newStaffId }) => {
      const { data, error } = await supabase.rpc('reschedule_booking', {
        p_booking_id: id,
        p_new_starts_at: newStartsAt,
        p_new_staff_id: newStaffId ?? null,
      });
      if (error) throw new Error(error.message);
      return data as unknown as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation<Booking, Error, { id: string; status: BookingStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
