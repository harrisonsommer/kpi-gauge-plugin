import type { CustomPluginConfigOptions } from '@sigmacomputing/plugin';
import { DIRECTION_LABELS } from './types';

const DIRECTION_VALUES = [DIRECTION_LABELS.higherIsBetter, DIRECTION_LABELS.lowerIsBetter];

/**
 * Builds the full editor panel definition. Only data bindings and semantics
 * (source, columns, title override, good/bad direction) live here — cosmetic
 * settings (colors, thresholds, number format, gauge thickness) live in the
 * plugin-owned `settings` JSON field, edited via the in-plugin settings
 * panel (gear icon, edit mode only). See the JSON Settings Pattern.
 */
export function buildEditorPanel(): CustomPluginConfigOptions[] {
  return [
    { name: 'source', type: 'element', label: 'Data Source' },
    {
      name: 'actualColumn',
      type: 'column',
      source: 'source',
      allowMultiple: false,
      allowedTypes: ['number', 'integer'],
      label: 'Actual',
    },
    {
      name: 'budgetColumn',
      type: 'column',
      source: 'source',
      allowMultiple: false,
      allowedTypes: ['number', 'integer'],
      label: 'Budget',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title (optional — defaults to the Actual column name)',
      placeholder: 'e.g. Occupancy vs Budget',
    },
    {
      name: 'direction',
      type: 'dropdown',
      values: DIRECTION_VALUES,
      defaultValue: DIRECTION_LABELS.higherIsBetter,
      label: 'Direction',
    },
    {
      name: 'settings',
      type: 'text',
      multiline: true,
      defaultValue: '{}',
      label: 'Gauge Settings (JSON — managed by the plugin, not for hand-editing)',
    },
    { name: 'editMode', type: 'toggle', label: 'Edit Mode (show settings gear)' },
  ];
}
