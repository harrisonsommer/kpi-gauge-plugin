import type { Settings } from '../sigma/types';

export const DEFAULT_SETTINGS: Settings = {
  subtitle: 'Variance to Budget',

  numberFormat: 'auto',
  decimals: 1,

  goodColor: '#16a34a',
  badColor: '#dc2626',
  neutralColor: '#6b7280',
  trackColor: '#e5e7eb',
  targetColor: '#1f2937',

  // Signed-goodness of -5% or better (i.e. within 5 points of budget, or
  // ahead of it, in the configured direction) reads as "good".
  greenThresholdPct: -5,
  // Signed-goodness of -15% or worse reads as "bad". Between the two
  // thresholds is "neutral".
  redThresholdPct: -15,

  gaugeThickness: 10,
  showBudgetLabel: true,
};
