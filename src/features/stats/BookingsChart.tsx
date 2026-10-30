import { parse, format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AdminStats } from '@/types/domain';
import { formatPrice } from '@/lib/utils';
import { useThemeColor } from '@/lib/useThemeColor';

function monthLabel(ym: string): string {
  const d = parse(ym, 'yyyy-MM', new Date());
  return format(d, 'LLL yy', { locale: it });
}

interface Row {
  label: string;
  count: number;
  revenue: number;
}

export function BookingsChart({ byMonth }: { byMonth: AdminStats['by_month'] }) {
  const primary = useThemeColor('primary', 'rgb(111 78 55)');
  const accent = useThemeColor('accent', 'rgb(201 138 94)');
  const border = useThemeColor('border', 'rgb(226 214 197)');
  const muted = useThemeColor('muted-foreground', 'rgb(138 122 104)');

  const data: Row[] = byMonth.map((m) => ({
    label: monthLabel(m.month),
    count: m.count,
    revenue: m.revenue_cents / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: muted }} tickLine={false} axisLine={{ stroke: border }} />
        <YAxis
          yAxisId="left"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: muted }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: muted }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: 'rgb(0 0 0 / 0.04)' }}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${border}`,
            fontSize: 13,
          }}
          formatter={(value: number, name: string) =>
            name === 'Fatturato' ? [formatPrice(value * 100), name] : [value, name]
          }
        />
        <Bar
          yAxisId="left"
          dataKey="count"
          name="Prenotazioni"
          fill={primary}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Line
          yAxisId="right"
          dataKey="revenue"
          name="Fatturato"
          stroke={accent}
          strokeWidth={2.5}
          dot={{ r: 3, fill: accent }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
