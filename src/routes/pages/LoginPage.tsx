import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { AuthShell } from '@/features/auth/AuthShell';
import { translateAuthError } from '@/features/auth/authErrors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Inserisci un’email valida.'),
  password: z.string().min(1, 'Inserisci la password.'),
});
type FormValues = z.infer<typeof schema>;

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/';

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(translateAuthError(err instanceof Error ? err.message : 'Errore di accesso.'));
    }
  }

  return (
    <AuthShell
      title="Accedi"
      subtitle="Bentornato! Inserisci le tue credenziali."
      footer={
        <>
          Non hai un account?{' '}
          <Link to="/registrati" className="font-medium text-primary hover:underline">
            Registrati
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
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Accedi
        </Button>
      </form>
    </AuthShell>
  );
}
