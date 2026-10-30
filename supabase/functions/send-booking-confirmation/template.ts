// Template delle email transazionali (conferma, spostamento, cancellazione).
// HTML con stili inline per la massima compatibilità con i client di posta.

export interface BookingEmailData {
  businessName: string;
  customerName: string;
  serviceName: string;
  locationName: string;
  staffName: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  timezone: string;
  primaryColor?: string; // es. "#6f4e37"
}

/** Righe "Sede" e "Operatore" comuni a tutte le email. */
function placeLines(data: BookingEmailData): string {
  return `
    <p style="margin:8px 0 0;color:#6b5d4f;font-size:14px;">📍 ${escapeHtml(data.locationName)}</p>
    <p style="margin:2px 0 0;color:#6b5d4f;font-size:14px;">👤 ${escapeHtml(data.staffName)}</p>`;
}

export interface RescheduleEmailData extends BookingEmailData {
  oldStartsAt: string; // ISO (orario precedente)
}

function fmtDate(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(iso));
}

function fmtTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(iso));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Guscio comune: header brand + titolo + intro + box informativo + nota. */
function shell(opts: {
  businessName: string;
  primary: string;
  heading: string;
  intro: string;
  infoHtml: string;
  footerNote: string;
}): string {
  const { businessName, primary, heading, intro, infoHtml, footerNote } = opts;
  return `<!doctype html>
<html lang="it">
  <body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b211a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf9;border-radius:14px;overflow:hidden;border:1px solid #e2d6c5;">
            <tr>
              <td style="background:${primary};padding:20px 24px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${escapeHtml(businessName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <h1 style="margin:0 0 8px;font-size:22px;">${heading}</h1>
                <p style="margin:0;color:#6b5d4f;font-size:15px;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e8;border:1px solid #e2d6c5;border-radius:10px;">
                  <tr><td style="padding:16px 18px;">${infoHtml}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 28px;">
                <p style="margin:0;color:#a3947f;font-size:13px;">${footerNote}</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#a3947f;font-size:12px;">${escapeHtml(businessName)} · Prenotazioni online</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// --- Conferma ----------------------------------------------------------------
export function renderBookingEmailSubject(data: BookingEmailData): string {
  return `Conferma prenotazione · ${data.businessName} — ${fmtDate(data.startsAt, data.timezone)}`;
}

export function renderBookingEmailHtml(data: BookingEmailData): string {
  const date = fmtDate(data.startsAt, data.timezone);
  const info = `
    <p style="margin:0 0 6px;font-size:16px;font-weight:600;">${escapeHtml(data.serviceName)}</p>
    <p style="margin:0;color:#6b5d4f;font-size:14px;text-transform:capitalize;">${date}</p>
    <p style="margin:4px 0 0;color:#6b5d4f;font-size:14px;">Dalle ${fmtTime(data.startsAt, data.timezone)} alle ${fmtTime(data.endsAt, data.timezone)}</p>${placeLines(data)}`;
  return shell({
    businessName: data.businessName,
    primary: data.primaryColor ?? '#6f4e37',
    heading: 'Prenotazione confermata ✅',
    intro: `Ciao ${escapeHtml(data.customerName)}, la tua prenotazione è stata registrata con successo.`,
    infoHtml: info,
    footerNote:
      'Se non puoi presentarti, ti chiediamo di annullare con anticipo dalla tua area "Le mie prenotazioni". Grazie!',
  });
}

// --- Spostamento -------------------------------------------------------------
export function renderRescheduleEmailSubject(data: RescheduleEmailData): string {
  return `Appuntamento spostato · ${data.businessName} — ${fmtDate(data.startsAt, data.timezone)}`;
}

export function renderRescheduleEmailHtml(data: RescheduleEmailData): string {
  const newDate = fmtDate(data.startsAt, data.timezone);
  const info = `
    <p style="margin:0 0 6px;font-size:16px;font-weight:600;">${escapeHtml(data.serviceName)}</p>
    <p style="margin:0 0 8px;color:#a3947f;font-size:13px;text-decoration:line-through;">
      Prima: ${fmtDate(data.oldStartsAt, data.timezone)}, ore ${fmtTime(data.oldStartsAt, data.timezone)}
    </p>
    <p style="margin:0;color:#2b211a;font-size:14px;text-transform:capitalize;font-weight:600;">${newDate}</p>
    <p style="margin:4px 0 0;color:#6b5d4f;font-size:14px;">Dalle ${fmtTime(data.startsAt, data.timezone)} alle ${fmtTime(data.endsAt, data.timezone)}</p>${placeLines(data)}`;
  return shell({
    businessName: data.businessName,
    primary: data.primaryColor ?? '#6f4e37',
    heading: 'Appuntamento spostato 🗓️',
    intro: `Ciao ${escapeHtml(data.customerName)}, il tuo appuntamento è stato spostato a un nuovo orario.`,
    infoHtml: info,
    footerNote: 'Se il nuovo orario non ti va bene, contattaci pure. A presto!',
  });
}

// --- Cancellazione -----------------------------------------------------------
export function renderCancellationEmailSubject(data: BookingEmailData): string {
  return `Appuntamento annullato · ${data.businessName} — ${fmtDate(data.startsAt, data.timezone)}`;
}

export function renderCancellationEmailHtml(data: BookingEmailData): string {
  const date = fmtDate(data.startsAt, data.timezone);
  const info = `
    <p style="margin:0 0 6px;font-size:16px;font-weight:600;">${escapeHtml(data.serviceName)}</p>
    <p style="margin:0;color:#6b5d4f;font-size:14px;text-transform:capitalize;">${date}</p>
    <p style="margin:4px 0 0;color:#6b5d4f;font-size:14px;">Ore ${fmtTime(data.startsAt, data.timezone)}</p>${placeLines(data)}`;
  return shell({
    businessName: data.businessName,
    primary: data.primaryColor ?? '#6f4e37',
    heading: 'Appuntamento annullato',
    intro: `Ciao ${escapeHtml(data.customerName)}, il seguente appuntamento è stato annullato.`,
    infoHtml: info,
    footerNote: 'Puoi prenotare un nuovo appuntamento quando vuoi dal nostro sito. A presto!',
  });
}
