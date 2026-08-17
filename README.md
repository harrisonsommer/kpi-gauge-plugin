# KPI Gauge — a Sigma plugin

A [Sigma Computing](https://sigmacomputing.com) plugin that renders a single **Actual-vs-Budget KPI gauge**: a semicircular speedometer-style arc, filled to Actual's position on a 0..scale, colored green/gray/red by how far Actual is from Budget — with Budget drawn as an explicit **target-line tick** on the same arc, rather than a second bar. A big variance % callout sits above the gauge, and the Actual value sits below it. Built to reproduce the "vs Budget" gauge tiles (Occupancy, Rent, Revenue, NOI, Expense, Vacates, etc.) as a reusable, brandable plugin instead of Sigma's native chart.

Drop one instance of this plugin into a workbook per KPI (the same way you'd place 12 separate native gauge charts) — each instance is configured independently with its own data source, Actual/Budget columns, title, and good/bad direction.

Built with React + TypeScript + Vite on the [`@sigmacomputing/plugin`](https://github.com/sigmacomputing/plugin) SDK. No charting library — the arc is plain SVG.

---

## Local development

```bash
npm install
npm run dev
```

This starts a Vite dev server (default `http://localhost:5173`).

### Mock harness (no Sigma required)

Open **`http://localhost:5173/?mock=1`** to run the plugin against synthetic data instead of a live Sigma workbook, in edit mode. Append `&scenario=<key>` to try the four status outcomes:

| Scenario | What it shows |
|---|---|
| `good` (default) | Occupancy vs Budget, +0.3% — green ring, nearly full |
| `bad` | Revenue vs Budget, -44.4% — red ring, partial fill |
| `neutral` | RPSF vs Budget, -13.8% — gray ring (between thresholds) |
| `lowerIsBetterGood` | Vacates vs Budget, -33.8% with "Lower is better" — green, since a big negative variance is the desired outcome for this metric |

The mock harness (`src/dev/`) is loaded via a dynamic `import()`, so it never ships in a normal production build.

---

## Registering the plugin in Sigma

1. Run `npm run dev` and note the local URL (default `http://localhost:5173`).
2. In Sigma, go to **Administration → Plugins → Add Plugin** and register that URL.
3. In a workbook, click **Edit → + → Plugins**, and select the registered plugin.
4. Repeat once per KPI tile you want to replace (each instance is independent).
5. Configure each instance via the editor panel that appears in the right sidebar (see walkthrough below).

For production, run `npm run build`, deploy the `dist/` folder to any static host (Netlify, Vercel, S3+CloudFront, GitHub Pages, etc.), and register that URL instead.

---

## Editor panel walkthrough

For each gauge instance:

1. **Data Source** — the Sigma element (table) with your Actual and Budget columns.
2. **Actual** — the numeric column for the actual value.
3. **Budget** — the numeric column for the budget/target value.
4. **Title** (optional) — overrides the card title; defaults to the Actual column's display name.
5. **Direction** — `Higher is better` (Revenue, Occupancy, Rent, NOI, Rentals, Inquiries, Net Rentals, RPSF…) or `Lower is better` (Expenses, Vacates…). This flips which side of budget reads as "good" (green) vs "bad" (red).
6. **Edit Mode** — toggle on to reveal the settings gear (top-right of the gauge). Turn it off before sharing the workbook with viewers.

Only the first numeric row from each column is used — bind each gauge to a source that returns one summary row (e.g. a single-row KPI table, or a table pre-filtered/aggregated to one row per metric).

**Cosmetics** (colors, number format, decimals, gauge thickness, thresholds, subtitle text) are **not** in the editor panel — click the **⚙ gear icon** in the top-right corner of the gauge (visible only in Edit Mode) to open the settings panel.

---

## Status logic

The gauge computes a **signed-goodness** value: the variance % re-oriented so that "higher is always better", regardless of the configured direction. Two thresholds (in the settings panel) turn that into a status:

- `signedGoodness >= greenThresholdPct` (default `-5`) → **good** (green)
- `signedGoodness <= redThresholdPct` (default `-15`) → **bad** (red)
- otherwise → **neutral** (gray)

For a `higherIsBetter` metric, signed-goodness is just the variance %. For a `lowerIsBetter` metric, it's the negated variance % — so a metric like Vacates being 33.8% *under* budget reads as strongly good, not bad.

## Gauge scale

The arc is a fixed `0..scaleMax` scale, where `scaleMax = max(Actual, Budget) * 1.15` — 15% of headroom past whichever of the two is larger, so neither marker ever sits at the very end of the arc. Both Actual and Budget are positioned on that same scale:

- **Actual** fills the arc (colored by status) from the left end up to its position.
- **Budget** is drawn as a short dark tick line crossing the arc at its position — a target to hit, not a second bar.

The scale's endpoints (`0` and `scaleMax`, compactly formatted, e.g. `$45.8M`) are labeled under the arc for orientation.

---

## Settings JSON reference

Cosmetic settings are stored as JSON in the editor panel's hidden `settings` field (see the **JSON Settings Pattern**) and edited through the in-plugin settings panel, not by hand. For reference, the shape is:

```ts
interface Settings {
  subtitle: string;               // e.g. "Variance to Budget"

  numberFormat: 'auto' | 'percent' | 'currency' | 'number' | 'integer' | 'compact';
  decimals: number;

  goodColor: string;
  badColor: string;
  neutralColor: string;
  trackColor: string;             // the ring's unfilled track

  greenThresholdPct: number;       // signed-goodness at/above which the gauge reads "good"
  redThresholdPct: number;         // signed-goodness at/below which the gauge reads "bad"

  gaugeThickness: number;          // ring stroke width, px
  showBudgetLabel: boolean;        // show "Budget $X" caption under the Actual value
}
```

`numberFormat: 'auto'` infers the format from the Actual/Budget column's Sigma format metadata (`currency`, `percent`, `compact`, or falls back to `number`/`integer`). `percent` assumes the raw value is already a whole percentage (e.g. `87.0`, not `0.87`) — it appends `%` rather than multiplying by 100.

Malformed or partial JSON falls back to defaults (`src/settings/defaults.ts`) rather than breaking the plugin — see `src/settings/load.ts`.

---

## Known limitations

- **One row per gauge.** The plugin reads the first numeric value from the Actual and Budget columns — it doesn't aggregate across multiple rows. Pre-aggregate in Sigma (or bind to a single-row summary element) if your source has more than one row.
- **No writeback / interaction.** This is a display-only KPI card — no control variables, action triggers, or click-to-filter. Add them (see the `sigma-plugin-patterns` skill's Variable + Action Trigger pattern) if you want clicking a gauge to drive the rest of the workbook.
- **12 separate instances, 12 separate configs.** There's no shared "grid" plugin here — each tile is configured independently. If you'd rather manage all KPIs from one editor panel (Sigma's numbered-slot pattern, like a "Layer 1, Layer 2…" map), that's a different plugin shape — ask to have this one converted.

## Project layout

```
src/
  sigma/      editor panel definition + shared types (PluginConfig, Settings, Direction)
  settings/   the JSON-settings-field defaults/load (cosmetics live here, not the editor panel)
  ui/         Gauge (SVG ring), SettingsPanel (gear icon), EmptyState, shared form fields
  kpi.ts      variance/status computation + number formatting
  dev/        the ?mock=1 harness (dynamically imported, not in production builds)
```
