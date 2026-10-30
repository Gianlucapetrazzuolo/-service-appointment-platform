/**
 * Tipi del database, scritti a mano per rispecchiare le migration in
 * `supabase/migrations`. (In alternativa si possono generare con
 * `supabase gen types typescript` se in futuro si adotta la CLI.)
 *
 * Mantieni questo file allineato allo schema quando cambi le migration.
 */

export type UserRole = 'admin' | 'client';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/** Output aggregato di get_admin_stats() (solo admin). */
export interface AdminStats {
  total_clients: number;
  total_bookings: number;
  revenue_cents: number;
  by_month: { month: string; count: number; revenue_cents: number }[];
}

/** Riga di get_day_schedule: SOLO orari + operatore, mai dati cliente. */
export interface DayScheduleRow {
  staff_id: string;
  staff_name: string;
  is_free: boolean;
  starts_at: string;
  ends_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_min: number;
          price_cents: number;
          is_active: boolean;
          sort_order: number;
          is_package: boolean;
          description_long: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_min: number;
          price_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          is_package?: boolean;
          description_long?: string | null;
          image_url?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_min?: number;
          price_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          is_package?: boolean;
          description_long?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          image_url: string | null;
          category: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents?: number;
          image_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_cents?: number;
          image_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      home_slides: {
        Row: {
          id: string;
          image_url: string;
          title: string | null;
          subtitle: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          title?: string | null;
          subtitle?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          image_url?: string;
          title?: string | null;
          subtitle?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          timezone: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          timezone?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          address?: string | null;
          phone?: string | null;
          timezone?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          location_id: string;
          full_name: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          full_name: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          location_id?: string;
          full_name?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_location_id_fkey';
            columns: ['location_id'];
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      business_hours: {
        Row: {
          id: string;
          location_id: string;
          weekday: number;
          open_time: string;
          close_time: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          weekday: number;
          open_time: string;
          close_time: string;
        };
        Update: {
          location_id?: string;
          weekday?: number;
          open_time?: string;
          close_time?: string;
        };
        Relationships: [];
      };
      closures: {
        Row: {
          id: string;
          location_id: string | null;
          starts_at: string;
          ends_at: string;
          reason: string | null;
        };
        Insert: {
          id?: string;
          location_id?: string | null;
          starts_at: string;
          ends_at: string;
          reason?: string | null;
        };
        Update: {
          location_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: boolean;
          business_name: string;
          slug: string | null;
          timezone: string;
          slot_step_min: number;
          min_notice_min: number;
          max_advance_days: number;
          logo_url: string | null;
          theme: Record<string, unknown>;
          address: string | null;
          phone: string | null;
          email: string | null;
          about_description: string | null;
          about_history: string | null;
          socials: Record<string, string>;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          business_name?: string;
          slug?: string | null;
          timezone?: string;
          slot_step_min?: number;
          min_notice_min?: number;
          max_advance_days?: number;
          logo_url?: string | null;
          theme?: Record<string, unknown>;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          about_description?: string | null;
          about_history?: string | null;
          socials?: Record<string, string>;
        };
        Update: {
          business_name?: string;
          slug?: string | null;
          timezone?: string;
          slot_step_min?: number;
          min_notice_min?: number;
          max_advance_days?: number;
          logo_url?: string | null;
          theme?: Record<string, unknown>;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          about_description?: string | null;
          about_history?: string | null;
          socials?: Record<string, string>;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          service_id: string;
          customer_id: string;
          location_id: string;
          staff_id: string;
          starts_at: string;
          ends_at: string;
          status: BookingStatus;
          service_name: string;
          location_name: string;
          staff_name: string;
          price_cents: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: never; // si crea solo via RPC create_booking
        Update: {
          status?: BookingStatus;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_available_slots: {
        Args: {
          p_service_id: string;
          p_date: string;
          p_location_id?: string | null;
          p_staff_id?: string | null;
          p_exclude_booking_id?: string | null;
        };
        Returns: string[];
      };
      get_month_availability: {
        Args: {
          p_service_id: string;
          p_location_id: string;
          p_year: number;
          p_month: number;
          p_staff_id?: string | null;
        };
        Returns: string[];
      };
      get_day_schedule: {
        Args: { p_service_id: string; p_location_id: string; p_date: string };
        Returns: DayScheduleRow[];
      };
      reschedule_booking: {
        Args: { p_booking_id: string; p_new_starts_at: string; p_new_staff_id?: string | null };
        Returns: Database['public']['Tables']['bookings']['Row'];
      };
      create_booking: {
        Args: {
          p_service_id: string;
          p_starts_at: string;
          p_customer_name: string;
          p_customer_email: string;
          p_location_id?: string | null;
          p_staff_id?: string | null;
          p_customer_phone?: string | null;
          p_notes?: string | null;
        };
        Returns: Database['public']['Tables']['bookings']['Row'];
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: Database['public']['Tables']['bookings']['Row'];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_admin_stats: {
        Args: { p_location_id?: string | null };
        Returns: AdminStats;
      };
    };
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
    };
  };
}
