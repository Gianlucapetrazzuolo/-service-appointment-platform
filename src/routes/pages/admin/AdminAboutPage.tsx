import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import type { Settings } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useUpdateSettings } from '@/features/admin/settingsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

interface FormValues {
  about_description: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
}

export function AdminAboutPage() {
  const { data: settings, isLoading, isError } = useSettings();
  if (isLoading) return <FullPageSpinner />;
  if (isError || !settings) {
    return (
      <ErrorState
        title="Contenuti non disponibili"
        description="Assicurati di aver eseguito la migration v2 (campi su settings)."
      />
    );
  }
  return <AboutForm settings={settings} />;
}

function AboutForm({ settings }: { settings: Settings }) {
  const updateSettings = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const socials = (settings.socials ?? {}) as Record<string, string>;

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      about_description: settings.about_description ?? '',
      address: settings.address ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      instagram: socials.instagram ?? '',
      facebook: socials.facebook ?? '',
      tiktok: socials.tiktok ?? '',
      whatsapp: socials.whatsapp ?? '',
    },
  });

  function onSubmit(v: FormValues) {
    setSaved(false);
    const nextSocials: Record<string, string> = {};
    for (const key of ['instagram', 'facebook', 'tiktok', 'whatsapp'] as const) {
      if (v[key].trim()) nextSocials[key] = v[key].trim();
    }
    updateSettings.mutate(
      {
        about_description: v.about_description.trim() || null,
        address: v.address.trim() || null,
        phone: v.phone.trim() || null,
        email: v.email.trim() || null,
        socials: nextSocials,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chi siamo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Descrizione"
            rows={4}
            hint="Mostrata in cima alla pagina Chi siamo."
            {...register('about_description')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Indirizzo" placeholder="Via Roma 1, Napoli" {...register('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Telefono" type="tel" {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input label="Instagram (URL)" placeholder="https://instagram.com/…" {...register('instagram')} />
          <Input label="Facebook (URL)" placeholder="https://facebook.com/…" {...register('facebook')} />
          <Input label="TikTok (URL)" placeholder="https://tiktok.com/@…" {...register('tiktok')} />
          <Input label="WhatsApp (URL)" placeholder="https://wa.me/39…" {...register('whatsapp')} />
        </CardContent>
      </Card>

      {updateSettings.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {updateSettings.error.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={updateSettings.isPending}>
          Salva contenuti
        </Button>
        {saved && !updateSettings.isPending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <Check className="h-4 w-4" aria-hidden />
            Salvato
          </span>
        )}
      </div>
    </form>
  );
}
