import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground ' +
  'placeholder:text-muted-foreground transition-colors ' +
  'focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
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
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={cn(fieldBase, error && 'border-destructive focus-visible:border-destructive', className)}
          {...props}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={cn(fieldBase, 'min-h-[88px] resize-y', error && 'border-destructive', className)}
          {...props}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
