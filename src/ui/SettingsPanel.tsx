import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { NumberFormat, Settings } from '../sigma/types';
import { DEFAULT_SETTINGS } from '../settings/defaults';
import { CLOSE_BUTTON_STYLE, Field, INPUT_STYLE, PRIMARY_BUTTON_STYLE, SECONDARY_BUTTON_STYLE } from './fields';

export interface SettingsPanelProps {
  settings: Settings;
  onSave: (next: Settings) => void;
}

const GEAR_BUTTON_STYLE: CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  zIndex: 5,
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '1px solid #d1d5db',
  background: 'rgba(255,255,255,0.95)',
  cursor: 'pointer',
  fontSize: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
};

const PANEL_STYLE: CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  zIndex: 6,
  width: 250,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  padding: 12,
  fontSize: 12,
  color: '#1f2937',
  textAlign: 'left',
};

const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: 'auto', label: 'Auto (from column)' },
  { value: 'percent', label: 'Percent' },
  { value: 'currency', label: 'Currency' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'compact', label: 'Compact (1.2K)' },
];

/**
 * Edit-mode-gated custom settings UI — the "JSON Settings Pattern" from the
 * sigma-plugin-patterns skill. The editor panel only carries data bindings
 * (source, columns, title, direction); everything cosmetic lives here and
 * round-trips through the plugin's own `settings` JSON config field.
 */
export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(settings);
          setOpen(true);
        }}
        style={GEAR_BUTTON_STYLE}
        aria-label="Gauge settings"
        title="Gauge settings"
      >
        ⚙
      </button>
    );
  }

  const patch = (p: Partial<Settings>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div style={PANEL_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Gauge Settings</strong>
        <button type="button" onClick={() => setOpen(false)} style={CLOSE_BUTTON_STYLE} aria-label="Close">
          ×
        </button>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
        <Field label="Subtitle">
          <input type="text" value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} style={{ width: 130 }} />
        </Field>
        <Field label="Number format">
          <select value={draft.numberFormat} onChange={(e) => patch({ numberFormat: e.target.value as NumberFormat })}>
            {NUMBER_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Decimals">
          <input
            type="number"
            min={0}
            max={4}
            value={draft.decimals}
            onChange={(e) => patch({ decimals: Number(e.target.value) })}
            style={INPUT_STYLE}
          />
        </Field>
        <Field label="Show budget caption">
          <input type="checkbox" checked={draft.showBudgetLabel} onChange={(e) => patch({ showBudgetLabel: e.target.checked })} />
        </Field>
        <Field label="Gauge thickness">
          <input
            type="number"
            min={4}
            max={24}
            value={draft.gaugeThickness}
            onChange={(e) => patch({ gaugeThickness: Number(e.target.value) })}
            style={INPUT_STYLE}
          />
        </Field>

        <div style={{ height: 1, background: '#e5e7eb', margin: '10px 0' }} />

        <Field label="Good color">
          <input type="color" value={draft.goodColor} onChange={(e) => patch({ goodColor: e.target.value })} />
        </Field>
        <Field label="Neutral color">
          <input type="color" value={draft.neutralColor} onChange={(e) => patch({ neutralColor: e.target.value })} />
        </Field>
        <Field label="Bad color">
          <input type="color" value={draft.badColor} onChange={(e) => patch({ badColor: e.target.value })} />
        </Field>
        <Field label="Track color">
          <input type="color" value={draft.trackColor} onChange={(e) => patch({ trackColor: e.target.value })} />
        </Field>
        <Field label="Target line color">
          <input type="color" value={draft.targetColor} onChange={(e) => patch({ targetColor: e.target.value })} />
        </Field>

        <div style={{ height: 1, background: '#e5e7eb', margin: '10px 0' }} />

        <Field label="Green threshold (pts)">
          <input
            type="number"
            value={draft.greenThresholdPct}
            onChange={(e) => patch({ greenThresholdPct: Number(e.target.value) })}
            style={INPUT_STYLE}
          />
        </Field>
        <Field label="Red threshold (pts)">
          <input
            type="number"
            value={draft.redThresholdPct}
            onChange={(e) => patch({ redThresholdPct: Number(e.target.value) })}
            style={INPUT_STYLE}
          />
        </Field>
        <p style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2 }}>
          Thresholds are "signed goodness" — points ahead of budget in the direction configured on the editor panel. Above the
          green threshold reads good, below the red threshold reads bad, in between is neutral.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          type="button"
          onClick={() => {
            onSave(draft);
            setOpen(false);
          }}
          style={PRIMARY_BUTTON_STYLE}
        >
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} style={SECONDARY_BUTTON_STYLE}>
          Cancel
        </button>
        <button type="button" onClick={() => setDraft({ ...DEFAULT_SETTINGS })} style={{ ...SECONDARY_BUTTON_STYLE, marginLeft: 'auto' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
