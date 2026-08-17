import type { ColumnInfo, Direction, GaugeStatus, NumberFormat } from './sigma/types';

export interface GaugeMetrics {
  /** (actual - budget) / |budget| * 100. */
  variancePct: number;
  /** variancePct oriented so that "higher is always better", regardless of
   * the configured direction — this is what the thresholds compare against. */
  signedGoodness: number;
  status: GaugeStatus;
  /** Upper bound of the gauge's scale — always >= both actual and budget,
   * with headroom so neither marker sits at the very end of the arc. */
  scaleMax: number;
  /** Actual's position on the 0..scaleMax scale, clamped 0..1. Drives the
   * gauge's filled arc. */
  actualFraction: number;
  /** Budget's position on the same 0..scaleMax scale, clamped 0..1. Drives
   * the gauge's target-line tick mark. */
  budgetFraction: number;
}

/**
 * Computes the gauge's scale, variance, and good/neutral/bad status.
 *
 * Direction flips which side of budget counts as "good": for
 * higherIsBetter metrics (Revenue, Occupancy…) being above budget is good;
 * for lowerIsBetter metrics (Expenses, Vacates…) being below budget is
 * good. Thresholds are expressed as signed-goodness percentage points so
 * they read the same regardless of direction — e.g. redThresholdPct: -15
 * always means "15 points worse than budget, in whichever direction is bad
 * for this metric".
 *
 * The gauge itself is a fixed 0..scaleMax scale (not "% of budget") so the
 * budget can be drawn as an explicit target line rather than always sitting
 * at a fixed "100%" position — scaleMax is set just past whichever of
 * actual/budget is larger, so both markers always land inside the arc.
 */
export function computeGaugeMetrics(
  actual: number,
  budget: number,
  direction: Direction,
  greenThresholdPct: number,
  redThresholdPct: number,
): GaugeMetrics {
  const variancePct = budget !== 0 ? ((actual - budget) / Math.abs(budget)) * 100 : actual === 0 ? 0 : actual > 0 ? Infinity : -Infinity;
  const signedGoodness = direction === 'higherIsBetter' ? variancePct : -variancePct;

  let status: GaugeStatus = 'neutral';
  if (Number.isFinite(signedGoodness)) {
    if (signedGoodness >= greenThresholdPct) status = 'good';
    else if (signedGoodness <= redThresholdPct) status = 'bad';
  } else {
    status = signedGoodness > 0 ? 'good' : 'bad';
  }

  const rawMax = Math.max(actual, budget, 0);
  const scaleMax = rawMax > 0 ? rawMax * 1.15 : 1;
  const actualFraction = Math.max(0, Math.min(1, actual / scaleMax));
  const budgetFraction = Math.max(0, Math.min(1, budget / scaleMax));

  return { variancePct, signedGoodness, status, scaleMax, actualFraction, budgetFraction };
}

function resolveFormat(format: NumberFormat, column: ColumnInfo | undefined): Exclude<NumberFormat, 'auto'> {
  if (format !== 'auto') return format;
  const type = column?.format?.type;
  if (type === 'currency') return 'currency';
  if (type === 'percent') return 'percent';
  if (type === 'compact') return 'compact';
  if (column?.columnType === 'integer') return 'integer';
  return 'number';
}

/**
 * Formats a raw numeric value for display. `percent` assumes the raw value
 * is already scaled to a whole percentage (e.g. 87 → "87.0%"), matching how
 * budget/actual metrics are typically stored in Sigma tables — not a 0–1
 * fraction, so it deliberately doesn't use Intl's `style: 'percent'`
 * (which would multiply by 100).
 */
export function formatValue(value: number, format: NumberFormat, decimals: number, column?: ColumnInfo): string {
  const resolved = resolveFormat(format, column);
  switch (resolved) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: decimals,
        minimumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
    case 'integer':
      return Math.round(value).toLocaleString('en-US');
    case 'compact':
      return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: decimals }).format(value);
    case 'number':
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
}

export function formatSignedPct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return value > 0 ? '+∞%' : '-∞%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

/**
 * Formats a gauge scale endpoint (the "0" / max labels drawn under the
 * arc). Always compact, regardless of the configured decimals, since these
 * are orientation labels rather than precise readouts.
 */
export function formatScaleLabel(value: number, format: NumberFormat, column?: ColumnInfo): string {
  const resolved = resolveFormat(format, column);
  switch (resolved) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(
        value,
      );
    case 'percent':
      return `${Math.round(value)}%`;
    default:
      return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
}
