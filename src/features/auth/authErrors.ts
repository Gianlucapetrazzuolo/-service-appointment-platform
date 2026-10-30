/** Traduce i messaggi d'errore di Supabase Auth in italiano comprensibile. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o password non corretti.';
  if (m.includes('email not confirmed')) {
    return 'Devi confermare l’email prima di accedere. Controlla la posta.';
  }
  if (m.includes('user already registered')) return 'Esiste già un account con questa email.';
  if (m.includes('password should be at least')) {
    return 'La password è troppo corta (minimo 8 caratteri).';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Troppi tentativi. Riprova tra qualche minuto.';
  }
  if (m.includes('unable to validate email address')) return 'Indirizzo email non valido.';
  return message;
}
