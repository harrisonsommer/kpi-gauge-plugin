import { useConfig, useEditorPanelConfig, useElementColumns, useElementData, usePlugin } from '@sigmacomputing/plugin';
import { useCallback, useMemo } from 'react';
import './App.css';
import { computeGaugeMetrics, formatScaleLabel, formatSignedPct, formatValue } from './kpi';
import { buildEditorPanel } from './sigma/editorPanel';
import { labelToDirection, type ColumnInfo, type GaugeStatus, type PluginConfig, type Settings } from './sigma/types';
import { loadSettings, serializeSettings } from './settings/load';
import { EmptyState } from './ui/EmptyState';
import { Gauge } from './ui/Gauge';
import { SettingsPanel } from './ui/SettingsPanel';

function firstFiniteNumber(values: unknown[] | undefined): number | null {
  if (!values) return null;
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function statusColorFor(status: GaugeStatus, settings: Settings): string {
  switch (status) {
    case 'good':
      return settings.goodColor;
    case 'bad':
      return settings.badColor;
    case 'neutral':
    default:
      return settings.neutralColor;
  }
}

function App() {
  const config = (useConfig() ?? {}) as PluginConfig;

  // useEditorPanelConfig deep-equal-guards internally, so it's safe to call
  // on every render with a freshly-built array.
  useEditorPanelConfig(buildEditorPanel());

  const data = useElementData(config.source || '');
  const columns = (useElementColumns(config.source || '') ?? {}) as Record<string, ColumnInfo>;
  const settings = useMemo(() => loadSettings(config.settings), [config.settings]);
  const direction = labelToDirection(config.direction);
  const plugin = usePlugin();

  const handleSaveSettings = useCallback(
    (next: Settings) => {
      plugin.config.set({ settings: serializeSettings(next) });
    },
    [plugin],
  );

  const editMode = !!config.editMode;

  if (!config.source) {
    return (
      <div className="app-root">
        <EmptyState title="Set up this gauge" message="Select a data source in the editor panel." />
      </div>
    );
  }
  if (!config.actualColumn || !config.budgetColumn) {
    return (
      <div className="app-root">
        <EmptyState title="Set up this gauge" message="Select an Actual column and a Budget column in the editor panel." />
      </div>
    );
  }

  const actualValue = firstFiniteNumber(data[config.actualColumn] as unknown[] | undefined);
  const budgetValue = firstFiniteNumber(data[config.budgetColumn] as unknown[] | undefined);

  if (actualValue === null || budgetValue === null) {
    return (
      <div className="app-root">
        {editMode && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}
        <EmptyState title="No data available" message="The selected Actual/Budget columns returned no numeric rows." />
      </div>
    );
  }

  const actualColumnInfo = columns[config.actualColumn];
  const budgetColumnInfo = columns[config.budgetColumn];
  const title = config.title?.trim() || actualColumnInfo?.name || 'KPI';

  const metrics = computeGaugeMetrics(actualValue, budgetValue, direction, settings.greenThresholdPct, settings.redThresholdPct);
  const color = statusColorFor(metrics.status, settings);

  const formattedActual = formatValue(actualValue, settings.numberFormat, settings.decimals, actualColumnInfo);
  // Compact, not full-precision — this renders inside the arc's interior,
  // which narrows quickly above the baseline.
  const compactBudget = formatScaleLabel(budgetValue, settings.numberFormat, budgetColumnInfo);
  const varianceLabel = formatSignedPct(metrics.variancePct, settings.decimals);
  const minLabel = formatScaleLabel(0, settings.numberFormat, actualColumnInfo);
  const maxLabel = formatScaleLabel(metrics.scaleMax, settings.numberFormat, actualColumnInfo);

  return (
    <div className="app-root">
      {editMode && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}
      <div className="kpi-title">{title}</div>
      <div className="kpi-subtitle">{settings.subtitle}</div>
      <div className="kpi-variance" style={{ color }}>
        {varianceLabel}
      </div>
      <Gauge
        actualFraction={metrics.actualFraction}
        budgetFraction={metrics.budgetFraction}
        color={color}
        trackColor={settings.trackColor}
        targetColor={settings.targetColor}
        thickness={settings.gaugeThickness}
        centerValue={formattedActual}
        caption={settings.showBudgetLabel ? `Budget ${compactBudget}` : undefined}
        minLabel={minLabel}
        maxLabel={maxLabel}
      />
    </div>
  );
}

export default App;
