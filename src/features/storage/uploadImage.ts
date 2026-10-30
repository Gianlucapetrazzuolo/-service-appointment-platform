import { supabase } from '@/lib/supabase';

const BUCKET = 'media';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Carica un'immagine nel bucket pubblico `media` (sottocartella `folder`) e
 * restituisce l'URL pubblico. La scrittura è permessa solo agli admin via RLS.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Il file deve essere un’immagine.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Immagine troppo grande (max 5 MB).');
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
