// Edge Function: invia email transazionali sulle prenotazioni.
//
// Attivata da Database Webhook su `bookings`:
//   • INSERT (status confirmed)            → email di CONFERMA
//   • UPDATE status → 'cancelled'          → email di CANCELLAZIONE
//   • UPDATE starts_at cambiato (confirmed)→ email di SPOSTAMENTO
// Invia tramite Resend. Le chiavi sono variabili d'ambiente (secrets), mai nel codice.
//
// Secrets (Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY, FROM_EMAIL, WEBHOOK_SECRET (opzionale)
// Iniettati da Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  renderBookingEmailHtml,
  renderBookingEmailSubject,
  renderCancellationEmailHtml,
  renderCancellationEmailSubject,
  renderRescheduleEmailHtml,
  renderRescheduleEmailSubject,
  type BookingEmailData,
} from './template.ts';

interface BookingRecord {
  id: string;
  status: string;
  service_name: string;
  location_id: string;
  location_name: string;
  staff_name: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_email: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: BookingRecord | null;
  old_record: BookingRecord | null;
}

type EmailKind = 'confirmation' | 'cancellation' | 'reschedule';

/** Converte "111 78 55" (canali RGB) in "#6f4e37". */
function rgbChannelsToHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  return '#' + parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');
}

/** Decide quale email inviare (o nessuna) in base al payload. */
function decideEmail(p: WebhookPayload): EmailKind | null {
  const rec = p.record;
  if (!rec) return null;
  if (p.type === 'INSERT') {
    return rec.status === 'confirmed' ? 'confirmation' : null;
  }
  if (p.type === 'UPDATE') {
    const old = p.old_record;
    if (old && old.status !== 'cancelled' && rec.status === 'cancelled') return 'cancellation';
    if (old && rec.status === 'confirmed' && old.starts_at !== rec.starts_at) return 'reschedule';
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
  if (expectedSecret) {
    if (req.headers.get('x-webhook-secret') !== expectedSecret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const kind = decideEmail(payload);
  const booking = payload.record;
  if (!kind || !booking) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL');
  if (!resendApiKey || !fromEmail) {
    console.error('RESEND_API_KEY o FROM_EMAIL non configurati.');
    return new Response('Email non configurata', { status: 500 });
  }

  // Nome attività, fuso e colore brand dalle impostazioni.
  let businessName = 'La tua attività';
  let timezone = 'Europe/Rome';
  let primaryColor: string | undefined;
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: settings } = await supabase
      .from('settings')
      .select('business_name, timezone, theme')
      .eq('id', true)
      .maybeSingle();
    if (settings) {
      businessName = settings.business_name ?? businessName;
      timezone = settings.timezone ?? timezone;
      const themeColors = (settings.theme as { colors?: Record<string, string> } | null)?.colors;
      primaryColor = rgbChannelsToHex(themeColors?.primary);
    }
    // Fuso della sede del booking (multi-sede): ha precedenza per gli orari.
    const { data: loc } = await supabase
      .from('locations')
      .select('timezone')
      .eq('id', booking.location_id)
      .maybeSingle();
    if (loc?.timezone) timezone = loc.timezone;
  } catch (err) {
    console.error('Impossibile leggere settings, uso i default:', err);
  }

  const base: BookingEmailData = {
    businessName,
    customerName: booking.customer_name,
    serviceName: booking.service_name,
    locationName: booking.location_name,
    staffName: booking.staff_name,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    timezone,
    primaryColor,
  };

  let subject: string;
  let html: string;
  if (kind === 'cancellation') {
    subject = renderCancellationEmailSubject(base);
    html = renderCancellationEmailHtml(base);
  } else if (kind === 'reschedule') {
    const data = { ...base, oldStartsAt: payload.old_record!.starts_at };
    subject = renderRescheduleEmailSubject(data);
    html = renderRescheduleEmailHtml(data);
  } else {
    subject = renderBookingEmailSubject(base);
    html = renderBookingEmailHtml(base);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: booking.customer_email, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Errore Resend:', res.status, detail);
    return new Response('Invio email fallito', { status: 502 });
  }

  return new Response(JSON.stringify({ sent: true, kind }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
