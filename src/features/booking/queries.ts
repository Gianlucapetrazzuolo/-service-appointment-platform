import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/types/domain';
import type { DayScheduleRow } from '@/types/database.types';

export interface SlotOptions {
  locationId?: string | null; // null = sede di default (lato server)
  staffId?: string | null; // null = "qualsiasi operatore"
  excludeBookingId?: string; // per lo spostamento
}

/**
 * Slot liberi (ISO timestamptz) per un servizio in una data (yyyy-MM-dd),
 * per una sede e (opzionalmente) un operatore specifico. Calcolati lato server
 * da get_available_slots: niente PII, solo orari liberi.
 */
export function useAvailableSlots(
  serviceId: string | null,
  date: string | null,
  opts: SlotOptions = {},
) {
  const { locationId = null, staffId = null, excludeBookingId } = opts;
  return useQuery<string[]>({
    queryKey: ['availability', serviceId, date, locationId, staffId, excludeBookingId ?? null],
    enabled: !!serviceId && !!date,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_service_id: serviceId!,
        p_date: date!,
        p_location_id: locationId,
        p_staff_id: staffId,
        p_exclude_booking_id: excludeBookingId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as string[];
    },
  });
}

/**
 * Giorni del mese (yyyy-MM-dd) con almeno uno slot libero per servizio+sede.
 * Una sola chiamata per tutto il mese (RPC get_month_availability).
 */
export function useMonthAvailability(
  serviceId: string | null,
  locationId: string | null,
  year: number,
  month: number, // 1-12
) {
  return useQuery<Set<string>>({
    queryKey: ['month-availability', serviceId, locationId, year, month],
    enabled: !!serviceId && !!locationId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_month_availability', {
        p_service_id: serviceId!,
        p_location_id: locationId!,
        p_year: year,
        p_month: month,
        p_staff_id: null,
      });
      if (error) throw error;
      return new Set((data ?? []) as string[]);
    },
  });
}

/**
 * Agenda del giorno per operatore: per ogni operatore le fasce libere/occupate.
 * Nessun dato cliente (vedi RPC get_day_schedule).
 */
export function useDaySchedule(
  serviceId: string | null,
  locationId: string | null,
  date: string | null,
) {
  return useQuery<DayScheduleRow[]>({
    queryKey: ['day-schedule', serviceId, locationId, date],
    enabled: !!serviceId && !!locationId && !!date,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_day_schedule', {
        p_service_id: serviceId!,
        p_location_id: locationId!,
        p_date: date!,
      });
      if (error) throw error;
      return (data ?? []) as DayScheduleRow[];
    },
  });
}

export interface CreateBookingInput {
  serviceId: string;
  startsAt: string; // ISO
  locationId: string;
  staffId: string | null; // null = qualsiasi operatore (assegnato lato server)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

/** Crea una prenotazione tramite la RPC create_booking (ri-valida lato server). */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation<Booking, Error, CreateBookingInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.rpc('create_booking', {
        p_service_id: input.serviceId,
        p_starts_at: input.startsAt,
        p_location_id: input.locationId,
        p_staff_id: input.staffId,
        p_customer_name: input.customerName,
        p_customer_email: input.customerEmail,
        p_customer_phone: input.customerPhone ?? null,
        p_notes: input.notes ?? null,
      });
      if (error) throw new Error(error.message);
      return data as unknown as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

/** Prenotazioni dell'utente corrente (RLS restituisce solo le proprie). */
export function useMyBookings() {
  return useQuery<Booking[]>({
    queryKey: ['my-bookings'],
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

/** Annulla una prenotazione (propria, o qualsiasi se admin) via RPC. */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation<Booking, Error, string>({
    mutationFn: async (bookingId) => {
      const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });
      if (error) throw new Error(error.message);
      return data as unknown as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });
}
