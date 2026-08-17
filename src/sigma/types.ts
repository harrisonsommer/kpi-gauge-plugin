// Shared types for the KPI Gauge plugin.
//
// Note on the real @sigmacomputing/plugin API (verified against the
// layered-map-plugin reference, built against the installed v1.2.0 source):
//   - Dropdown/radio `values` must be string[] — coerce numbers to strings.
//   - useVariable() returns WorkbookVariable | undefined, whose *current
//     value* lives at `variable.defaultValue.value`, not `variable.value`.
//   - useActionTrigger() returns a synchronous () => void, not an async fn.
//   - useEditorPanelConfig() already deep-equal-guards against redundant
//     configureEditorPanel() calls, so callers don't need their own memoing
//     for correctness (only for render-cost reasons).

export type Direction = 'higherIsBetter' | 'lowerIsBetter';

export const DIRECTION_LABELS: Record<Direction, string> = {
  higherIsBetter: 'Higher is better (Revenue, Occupancy, Rent…)',
  lowerIsBetter: 'Lower is better (Expenses, Vacates…)',
};

export const DIRECTION_BY_LABEL: Record<string, Direction> = Object.fromEntries(
  (Object.keys(DIRECTION_LABELS) as Direction[]).map((d) => [DIRECTION_LABELS[d], d]),
);

export function labelToDirection(label: string | undefined): Direction {
  if (label && DIRECTION_BY_LABEL[label]) return DIRECTION_BY_LABEL[label];
  return 'higherIsBetter';
}

export type NumberFormat = 'auto' | 'percent' | 'currency' | 'number' | 'integer' | 'compact';

/**
 * Raw plugin config object as declared by the editor panel (see
 * sigma/editorPanel.ts).
 */
export interface PluginConfig {
  source?: string;
  actualColumn?: string;
  budgetColumn?: string;
  /** Optional override; falls back to the Actual column's display name. */
  title?: string;
  /** Dropdown value (string label), resolved via labelToDirection(). */
  direction?: string;
  /** JSON-serialized Settings object (see settings/defaults.ts). */
  settings?: string;
  editMode?: boolean;
  [key: string]: unknown;
}

/** Minimal shape of a Sigma column, independent of the SDK's exact type. */
export interface ColumnInfo {
  id: string;
  name: string;
  columnType: string;
  format?: { type: string; format: string };
}

export type GaugeStatus = 'good' | 'neutral' | 'bad';

/**
 * Cosmetic/behavioral settings for the gauge. Everything here lives in the
 * plugin-owned `settings` JSON field, not the Sigma editor panel — see the
 * JSON Settings Pattern in the sigma-plugin-patterns skill. Data bindings
 * (source/columns/title/direction) stay in the editor panel since they're
 * data semantics, not cosmetics.
 */
export interface Settings {
  subtitle: string;

  numberFormat: NumberFormat;
  decimals: number;

  goodColor: string;
  badColor: string;
  neutralColor: string;
  trackColor: string;
  /** Color of the budget target-line tick drawn on the gauge. */
  targetColor: string;

  /** Signed-goodness threshold (in percentage points) at/above which the
   * gauge is colored `goodColor`. See App.tsx's computeStatus(). */
  greenThresholdPct: number;
  /** Signed-goodness threshold (in percentage points) at/below which the
   * gauge is colored `badColor`. */
  redThresholdPct: number;

  gaugeThickness: number;
  showBudgetLabel: boolean;
}
