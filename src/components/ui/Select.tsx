import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, required, children, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-invalid={!!error}
            className={cn(
              'w-full appearance-none rounded-md border border-input bg-card px-3 py-2.5 pr-9 text-base text-foreground transition-colors',
              'focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';
