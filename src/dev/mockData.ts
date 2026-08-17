import type { ColumnInfo } from '../sigma/types';

export interface MockElement {
  columns: Record<string, ColumnInfo>;
  data: Record<string, unknown[]>;
}

type MockFormat = 'percent' | 'currency' | 'integer' | 'number';

interface Scenario {
  actual: number;
  budget: number;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  title: string;
  format: MockFormat;
}

/** Scenarios chosen to mirror the four color/status outcomes seen on the
 * source dashboard's KPI grid — good, bad, neutral, and a lowerIsBetter
 * metric that reads good despite a large negative variance. Pick one with
 * `?mock=1&scenario=<key>`. */
const SCENARIOS: Record<string, Scenario> = {
  good: { actual: 87.0, budget: 86.7, direction: 'higherIsBetter', title: 'Occupancy vs Budget', format: 'percent' },
  bad: { actual: 22137018, budget: 39818339, direction: 'higherIsBetter', title: 'Revenue vs Budget', format: 'currency' },
  neutral: { actual: 23.2, budget: 26.91, direction: 'higherIsBetter', title: 'RPSF vs Budget', format: 'number' },
  lowerIsBetterGood: { actual: 5025, budget: 7586, direction: 'lowerIsBetter', title: 'Vacates vs Budget', format: 'integer' },
};

function currentScenarioKey(): string {
  const key = new URLSearchParams(window.location.search).get('scenario');
  return key && SCENARIOS[key] ? key : 'good';
}

const DIRECTION_LABEL: Record<Scenario['direction'], string> = {
  higherIsBetter: 'Higher is better (Revenue, Occupancy, Rent…)',
  lowerIsBetter: 'Lower is better (Expenses, Vacates…)',
};

export function buildMockConfig(): Record<string, unknown> {
  const s = SCENARIOS[currentScenarioKey()];
  return {
    source: 'kpi-source',
    actualColumn: 'col-actual',
    budgetColumn: 'col-budget',
    title: s.title,
    direction: DIRECTION_LABEL[s.direction],
    settings: '{}',
    editMode: true,
  };
}

function formatMetaFor(format: MockFormat): ColumnInfo['format'] {
  switch (format) {
    case 'percent':
      return { type: 'percent', format: ',.1f' };
    case 'currency':
      return { type: 'currency', format: '$,.0f' };
    case 'integer':
      return { type: 'number', format: ',.0f' };
    case 'number':
    default:
      return { type: 'number', format: ',.1f' };
  }
}

export async function buildMockElements(): Promise<Record<string, MockElement>> {
  const s = SCENARIOS[currentScenarioKey()];
  const format = formatMetaFor(s.format);
  const columnType = s.format === 'integer' ? 'integer' : 'number';

  return {
    'kpi-source': {
      columns: {
        'col-actual': { id: 'col-actual', name: 'Actual', columnType, format },
        'col-budget': { id: 'col-budget', name: 'Budget', columnType, format },
      },
      data: {
        'col-actual': [s.actual],
        'col-budget': [s.budget],
      },
    },
  };
}
