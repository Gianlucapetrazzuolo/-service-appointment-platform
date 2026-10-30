import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import type { Settings } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useUpdateSettings } from '@/features/admin/settingsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

const TIMEZONES = [
  'Europe/Rome',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
];

/** "#4f46e5" -> "79 70 229" (canali RGB usati dal tema). */
function hexToChannels(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '79 70 229';
  const n = parseInt(m[1]!, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** "79 70 229" -> "#4f46e5" per gli input di tipo color. */
function channelsToHex(channels: string | undefined, fallback: string): string {
  if (!channels) return fallback;
  const parts = channels.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((x) => Number.isNaN(x))) return fallback;
  return '#' + parts.map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

interface FormValues {
  business_name: string;
  timezone: string;
  slot_step_min: number;
  min_notice_min: number;
  max_advance_days: number;
  logo_url: string;
  primaryColor: string;
  accentColor: string;
}

function themeColors(settings: Settings): Record<string, string> {
  return ((settings.theme as { colors?: Record<string, string> } | null)?.colors ?? {}) as Record<
    string,
    string
  >;
}

export function AdminSettingsPage() {
  const { data: settings, isLoading, isError } = useSettings();

  if (isLoading) return <FullPageSpinner />;
  if (isError || !settings) {
    return (
      <ErrorState
        title="Impostazioni non disponibili"
        description="Assicurati di aver eseguito le migration del database (tabella settings)."
      />
    );
  }
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: Settings }) {
  const updateSettings = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const colors = themeColors(settings);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      business_name: settings.business_name,
      timezone: settings.timezone,
      slot_step_min: settings.slot_step_min,
      min_notice_min: settings.min_notice_min,
      max_advance_days: settings.max_advance_days,
      logo_url: settings.logo_url ?? '',
      primaryColor: channelsToHex(colors.primary, '#4f46e5'),
      accentColor: channelsToHex(colors.accent, '#ec4899'),
    },
  });

  function onSubmit(values: FormValues) {
    setSaved(false);
    const newTheme = {
      ...(settings.theme as Record<string, unknown>),
      colors: {
        ...colors,
        primary: hexToChannels(values.primaryColor),
        accent: hexToChannels(values.accentColor),
      },
    };
    updateSettings.mutate(
      {
        business_name: values.business_name.trim(),
        timezone: values.timezone,
        slot_step_min: Number(values.slot_step_min),
        min_notice_min: Number(values.min_notice_min),
        max_advance_days: Number(values.max_advance_days),
        logo_url: values.logo_url.trim() ? values.logo_url.trim() : null,
        theme: newTheme,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  // Inserisce il fuso corrente in elenco se non già presente.
  const tzOptions = TIMEZONES.includes(settings.timezone)
    ? TIMEZONES
    : [settings.timezone, ...TIMEZONES];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome attività"
            required
            error={errors.business_name?.message}
            {...register('business_name', { required: 'Obbligatorio' })}
          />
          <ImageUpload
            label="Logo"
            folder="branding"
            aspect="square"
            className="max-w-[220px]"
            value={watch('logo_url') || null}
            onChange={(url) => setValue('logo_url', url ?? '', { shouldDirty: true })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Colore primario</label>
              <input type="color" className="h-11 w-full cursor-pointer rounded-md border border-input bg-card" {...register('primaryColor')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Colore accento</label>
              <input type="color" className="h-11 w-full cursor-pointer rounded-md border border-input bg-card" {...register('accentColor')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regole prenotazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select label="Fuso orario" {...register('timezone')}>
            {tzOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Passo slot (min)"
              type="number"
              inputMode="numeric"
              hint="Es. 15, 30"
              {...register('slot_step_min')}
            />
            <Input
              label="Preavviso (min)"
              type="number"
              inputMode="numeric"
              hint="Minimo prima dell’orario"
              {...register('min_notice_min')}
            />
            <Input
              label="Anticipo max (giorni)"
              type="number"
              inputMode="numeric"
              hint="Finestra prenotabile"
              {...register('max_advance_days')}
            />
          </div>
        </CardContent>
      </Card>

      {updateSettings.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {updateSettings.error.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={updateSettings.isPending}>
          Salva impostazioni
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
