import { useAdminLocations } from '@/features/admin/locationsAdmin';
import { Select } from '@/components/ui/Select';

/**
 * Selettore sede per le pagine admin. `allowAll` aggiunge l'opzione
 * "Tutte le sedi" (valore null). Usa l'elenco completo (anche inattive).
 */
export function LocationSelect({
  value,
  onChange,
  allowAll = false,
  label,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  allowAll?: boolean;
  label?: string;
  className?: string;
}) {
  const { data: locations } = useAdminLocations();
  return (
    <Select
      label={label}
      className={className}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {allowAll && <option value="">Tutte le sedi</option>}
      {(locations ?? []).map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
          {!l.is_active ? ' (inattiva)' : ''}
        </option>
      ))}
    </Select>
  );
}
