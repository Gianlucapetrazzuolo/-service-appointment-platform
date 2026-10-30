import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage } from '@/features/storage/uploadImage';
import { cn } from '@/lib/utils';

/**
 * Campo di upload immagine: anteprima + carica/sostituisci/rimuovi.
 * Salva su Storage `media/<folder>` e comunica l'URL pubblico via onChange.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  aspect = 'video',
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  aspect?: 'video' | 'square';
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload non riuscito.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <span className="block text-sm font-medium text-foreground">{label}</span>}

      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-dashed border-border bg-muted/40',
          aspect === 'video' ? 'aspect-video' : 'aspect-square',
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImagePlus className="h-6 w-6" aria-hidden />
            <span className="text-xs">Nessuna immagine</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {value ? 'Sostituisci' : 'Carica immagine'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Rimuovi
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
