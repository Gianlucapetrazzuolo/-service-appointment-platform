import { Facebook, Instagram, Mail, MapPin, MessageCircle, Music2, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSettings } from '@/features/settings/queries';
import { useLocations } from '@/features/locations/queries';
import { OpeningHours } from '@/features/settings/OpeningHours';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FullPageSpinner } from '@/components/ui/Spinner';

const SOCIALS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'tiktok', label: 'TikTok', icon: Music2 },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export function AboutPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: locations } = useLocations();

  if (isLoading) return <FullPageSpinner />;

  const socials = (settings?.socials ?? {}) as Record<string, string>;
  const activeSocials = SOCIALS.filter((s) => socials[s.key]?.trim());

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Chi siamo</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Colonna sinistra: descrizione (+ social) */}
          <div className="space-y-8">
            {settings?.about_description && (
              <p className="text-lg leading-relaxed text-muted-foreground">
                {settings.about_description}
              </p>
            )}

            {activeSocials.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-2xl font-semibold">Seguici</h2>
                <div className="flex flex-wrap gap-3">
                  {activeSocials.map(({ key, label, icon: Icon }) => (
                    <a
                      key={key}
                      href={socials[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Colonna destra: Dove siamo + Orari, impilati */}
          <aside className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Dove siamo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="divide-y divide-border">
                {(locations ?? []).map((loc) => (
                  <div key={loc.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-foreground">{loc.name}</p>
                    {loc.address && (
                      <a
                        href={mapsUrl(loc.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>{loc.address}</span>
                      </a>
                    )}
                    {loc.phone && (
                      <a
                        href={`tel:${loc.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4 shrink-0" aria-hidden />
                        {loc.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="mt-3 flex items-center gap-2 break-all border-t border-border pt-3 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {settings.email}
                </a>
              )}
            </CardContent>
          </Card>

          <OpeningHours />
          </aside>
        </div>
      </div>
    </Container>
  );
}
