import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AuthShell } from '@/features/auth/AuthShell';
import { translateAuthError } from '@/features/auth/authErrors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';

const schema = z.object({
  fullName: z.string().min(2, 'Inserisci il tuo nome.'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s().-]{5,}$/, 'Numero di telefono non valido.')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Inserisci un’email valida.'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri.'),
});
type FormValues = z.infer<typeof schema>;

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const { needsEmailConfirm } = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
      });
      if (needsEmailConfirm) {
        setEmailSent(true);
      } else {
        // Conferma email disattivata: sessione già attiva.
        navigate('/', { replace: true });
      }
    } catch (err) {
      setFormError(
        translateAuthError(err instanceof Error ? err.message : 'Errore di registrazione.'),
      );
    }
  }

  if (emailSent) {
    return (
      <AuthShell title="Controlla la tua email">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            Ti abbiamo inviato un link di conferma. Aprilo per attivare l’account, poi accedi.
          </p>
          <Link to="/login" className={buttonClasses({ className: 'w-full' })}>
            Vai al login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crea il tuo account"
      subtitle="Bastano pochi secondi per iniziare a prenotare."
      footer={
        <>
          Hai già un account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Accedi
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}
        <Input
          label="Nome e cognome"
          autoComplete="name"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Telefono"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          hint="Facoltativo, utile per eventuali avvisi."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Registrati
        </Button>
      </form>
    </AuthShell>
  );
}
