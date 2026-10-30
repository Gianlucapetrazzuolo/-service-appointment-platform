import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

function StateShell({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <StateShell
      icon={<Inbox className="h-6 w-6" aria-hidden />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function ErrorState({
  title = 'Qualcosa è andato storto',
  description = 'Riprova più tardi. Se il problema persiste, controlla la connessione o la configurazione di Supabase.',
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <StateShell
      icon={<AlertTriangle className="h-6 w-6 text-warning" aria-hidden />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}
