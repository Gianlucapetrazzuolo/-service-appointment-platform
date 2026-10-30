import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted-foreground', className)} aria-hidden />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">Caricamento…</span>
    </div>
  );
}
