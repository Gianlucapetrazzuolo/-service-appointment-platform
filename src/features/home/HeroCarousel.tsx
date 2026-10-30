import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import { useSlides } from './slidesQueries';

const INTERVAL_MS = 5500;

/**
 * Hero con carosello di immagini di sfondo (auto-avanzamento, dissolvenza).
 * Se non ci sono slide, mostra uno sfondo sfumato di fallback.
 * Il contenuto (titolo/sottotitolo + CTA) è sovrapposto in `children`.
 */
export function HeroCarousel({
  fallbackTitle,
  fallbackSubtitle,
  children,
}: {
  fallbackTitle: string;
  fallbackSubtitle: string;
  children: ReactNode;
}) {
  const { data: slides } = useSlides();
  const items = slides ?? [];
  const hasSlides = items.length > 0;

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Mantiene l'indice valido se cambia il numero di slide.
  useEffect(() => {
    if (idx >= items.length) setIdx(0);
  }, [items.length, idx]);

  // Auto-avanzamento (sospeso su hover/focus).
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [items.length, paused]);

  const current = items[idx];
  const title = current?.title || fallbackTitle;
  const subtitle = current?.subtitle || fallbackSubtitle;

  const go = (n: number) => setIdx((i) => (i + n + items.length) % items.length);

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Sfondo */}
      {hasSlides ? (
        items.map((s, i) => (
          <div
            key={s.id}
            aria-hidden
            className={cn(
              'absolute inset-0 transition-opacity duration-[1200ms] ease-in-out',
              i === idx ? 'opacity-100' : 'opacity-0',
            )}
          >
            <img src={s.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 to-background" aria-hidden />
      )}

      {/* Velo per leggibilità (solo con immagini) */}
      {hasSlides && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/30"
          aria-hidden
        />
      )}

      {/* Contenuto */}
      <Container className="relative flex min-h-[68vh] flex-col items-center justify-center py-20 text-center sm:min-h-[72vh]">
        <h1
          className={cn(
            'font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
            hasSlides ? 'text-white drop-shadow' : 'text-foreground',
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            'mt-4 max-w-xl text-lg',
            hasSlides ? 'text-white/90 drop-shadow' : 'text-muted-foreground',
          )}
        >
          {subtitle}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{children}</div>
      </Container>

      {/* Frecce (desktop) */}
      {items.length > 1 && (
        <>
          <CarouselArrow side="left" onClick={() => go(-1)} />
          <CarouselArrow side="right" onClick={() => go(1)} />
        </>
      )}

      {/* Indicatori */}
      {items.length > 1 && (
        <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
          {items.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Vai alla slide ${i + 1}`}
              aria-current={i === idx}
              onClick={() => setIdx(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === idx ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80',
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CarouselArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Slide precedente' : 'Slide successiva'}
      className={cn(
        'absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/30 md:block',
        side === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  );
}
