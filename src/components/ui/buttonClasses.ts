import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow',
  secondary: 'bg-muted text-foreground hover:bg-muted/70',
  outline: 'border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
  icon: 'h-11 w-11',
};

/**
 * Classi di un bottone, riutilizzabili anche su elementi non-<button>
 * (es. <Link> di react-router) per avere lo stesso stile senza `asChild`.
 */
export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = 'primary', size = 'md', className } = opts ?? {};
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium tracking-wide',
    'transition-all duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98] touch-manipulation',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
