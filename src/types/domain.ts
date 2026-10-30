/** Tipi di dominio applicativi, derivati dai tipi del database. */
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type Service = Tables['services']['Row'];
export type Product = Tables['products']['Row'];
export type HomeSlide = Tables['home_slides']['Row'];
export type Location = Tables['locations']['Row'];
export type Staff = Tables['staff']['Row'];
export type BusinessHour = Tables['business_hours']['Row'];
export type Closure = Tables['closures']['Row'];
export type Settings = Tables['settings']['Row'];
export type Booking = Tables['bookings']['Row'];

export type { UserRole, BookingStatus, AdminStats } from './database.types';

/** Giorni della settimana (0 = Domenica ... 6 = Sabato, come JS Date.getDay()). */
export const WEEKDAY_LABELS = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
] as const;
