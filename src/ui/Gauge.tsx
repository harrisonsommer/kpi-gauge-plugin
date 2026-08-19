export interface GaugeProps {
  /** Actual's position on the gauge's 0..scaleMax scale, clamped 0..1. */
  actualFraction: number;
  /** Budget's position on the same scale, clamped 0..1 — drawn as a target
   * tick line rather than a second arc. */
  budgetFraction: number;
  color: string;
  trackColor: string;
  /** Color of the budget target-line tick. */
  targetColor?: string;
  thickness?: number;
  /** Width of the gauge; height is derived (a semicircle plus label space). */
  size?: number;
  /** Full-precision formatted Actual value, e.g. "$22,137,018". */
  centerValue: string;
  /** Full-precision formatted Budget value, e.g. "$335,765" — labeled
   * "Budget" above it, stacked above the Actual value/label pair. Omit to
   * hide both the label and value. */
  budgetValue?: string;
  /** Formatted scale endpoints (e.g. "0" / "$45.0M"), shown under the arc. */
  minLabel?: string;
  maxLabel?: string;
}

const START_ANGLE = 180; // left end of the arc (scale = 0)
const END_ANGLE = 0; // right end of the arc (scale = scaleMax)

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
}

/** Arc path from startAngle to endAngle, sweeping over the top (through 90°)
 * — the two angles are always <= 180° apart here, so a fixed sweep
 * direction is safe without a general-purpose large-arc calculation. */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

/** Half-width of the arc's interior (inside the stroke's inner edge) at a
 * given vertical distance `dy` above the baseline — the half-disk narrows
 * as dy grows, reaching 0 at dy === innerR. */
function halfWidthAt(innerR: number, dy: number): number {
  return dy >= innerR ? 0 : Math.sqrt(innerR * innerR - dy * dy);
}

/** Shrinks `baseSize` down to `minSize` (never below it) so `text` fits
 * within `availableWidth`, assuming an average glyph width of `charWidthRatio
 * * fontSize`. Returns `baseSize` unchanged if it already fits. */
function fitFontSize(text: string, availableWidth: number, baseSize: number, minSize: number, charWidthRatio = 0.6): number {
  const naturalWidth = text.length * baseSize * charWidthRatio;
  if (naturalWidth <= availableWidth || text.length === 0) return baseSize;
  const fitted = availableWidth / (text.length * charWidthRatio);
  return Math.max(minSize, fitted);
}

/** A semicircular speedometer-style gauge: a fixed 0..scaleMax track, a
 * colored arc filled to Actual's position, and a target-line tick marking
 * Budget's position — so Budget reads as a target to hit, not a second
 * bar. Both values are labeled inside the arc's interior, stacked
 * bottom-up (Actual value + its label closest to the baseline, where the
 * half-disk is widest; Budget's label + value above that). Font sizes
 * shrink to fit the available width at each line's height, since the
 * interior narrows quickly above the baseline. No charting library needed
 * for one arc + one tick. */
export function Gauge({
  actualFraction,
  budgetFraction,
  color,
  trackColor,
  targetColor = '#1f2937',
  thickness = 12,
  size = 160,
  centerValue,
  budgetValue,
  minLabel,
  maxLabel,
}: GaugeProps) {
  const LABEL_MARGIN = 18; // horizontal room so the min/max scale labels don't clip at the arc's edges
  const r = (size - thickness) / 2;
  const cx = LABEL_MARGIN + size / 2;
  const cy = r + thickness / 2;
  const svgWidth = size + LABEL_MARGIN * 2;
  const svgHeight = cy + 18; // arc + room for the min/max scale labels below it
  const innerR = r - thickness / 2; // inner edge of the arc's stroke — the interior text must stay within this

  const clampedActual = Math.max(0, Math.min(1, actualFraction));
  const clampedBudget = Math.max(0, Math.min(1, budgetFraction));
  const sweep = START_ANGLE - END_ANGLE;
  const valueAngle = START_ANGLE - clampedActual * sweep;
  const budgetAngle = START_ANGLE - clampedBudget * sweep;

  const trackPath = describeArc(cx, cy, r, START_ANGLE, END_ANGLE);
  const valuePath = describeArc(cx, cy, r, START_ANGLE, valueAngle);

  const tickInner = polarToCartesian(cx, cy, r - thickness / 2 - 4, budgetAngle);
  const tickOuter = polarToCartesian(cx, cy, r + thickness / 2 + 4, budgetAngle);

  // Stacked bottom-up from the baseline (widest point of the interior
  // half-disk): "Actual" label, then the big Actual value, then the Budget
  // value, then the "Budget" label — each line has less horizontal room
  // than the one below it. Positions are estimated using each line's base
  // (unshrunk) font size first, then font sizes are fitted to the width
  // available at those estimated positions, then final positions are
  // recomputed from the fitted sizes — since fitting only ever shrinks a
  // size, the final stack is never taller than the estimate, so this never
  // ends up tighter than what was checked.
  const BASELINE_GAP = 3;
  const LINE_GAP = 3;
  const actualLabelBase = size * 0.052;
  const budgetLabelBase = size * 0.052;
  const actualValueBase = size * 0.12;
  const budgetValueBase = size * 0.1;
  const actualValueMin = size * 0.07;
  const budgetValueMin = size * 0.055;
  const labelMin = size * 0.04;

  const estDyActualLabel = BASELINE_GAP + actualLabelBase / 2;
  const estDyActualValue = estDyActualLabel + actualLabelBase / 2 + actualValueBase / 2 + LINE_GAP;
  const estDyBudgetValue = estDyActualValue + actualValueBase / 2 + budgetValueBase / 2 + LINE_GAP;
  const estDyBudgetLabel = estDyBudgetValue + budgetValueBase / 2 + budgetLabelBase / 2 + LINE_GAP;

  const actualLabelSize = fitFontSize('Actual', halfWidthAt(innerR, estDyActualLabel) * 1.8, actualLabelBase, labelMin);
  const actualValueSize = fitFontSize(centerValue, halfWidthAt(innerR, estDyActualValue) * 1.8, actualValueBase, actualValueMin);
  const budgetValueSize = budgetValue
    ? fitFontSize(budgetValue, halfWidthAt(innerR, estDyBudgetValue) * 1.8, budgetValueBase, budgetValueMin)
    : 0;
  const budgetLabelSize = budgetValue
    ? fitFontSize('Budget', halfWidthAt(innerR, estDyBudgetLabel) * 1.8, budgetLabelBase, labelMin)
    : 0;

  const dyActualLabel = BASELINE_GAP + actualLabelSize / 2;
  const dyActualValue = dyActualLabel + actualLabelSize / 2 + actualValueSize / 2 + LINE_GAP;
  const dyBudgetValue = dyActualValue + actualValueSize / 2 + budgetValueSize / 2 + LINE_GAP;
  const dyBudgetLabel = dyBudgetValue + budgetValueSize / 2 + budgetLabelSize / 2 + LINE_GAP;

  const labelStyle = { fontSize: 10, fill: '#94a3b8' };

  return (
    <div style={{ width: svgWidth, flexShrink: 0 }}>
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <path d={trackPath} fill="none" stroke={trackColor} strokeWidth={thickness} strokeLinecap="round" />
        <path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.4s ease' }}
        />
        <line
          x1={tickInner.x}
          y1={tickInner.y}
          x2={tickOuter.x}
          y2={tickOuter.y}
          stroke={targetColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {minLabel && (
          <text x={cx - r} y={cy + 14} textAnchor="middle" style={labelStyle}>
            {minLabel}
          </text>
        )}
        {maxLabel && (
          <text x={cx + r} y={cy + 14} textAnchor="middle" style={labelStyle}>
            {maxLabel}
          </text>
        )}
        {budgetValue && (
          <text
            x={cx}
            y={cy - dyBudgetLabel}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: budgetLabelSize, fill: '#64748b' }}
          >
            Budget
          </text>
        )}
        {budgetValue && (
          <text
            x={cx}
            y={cy - dyBudgetValue}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: budgetValueSize, fontWeight: 600, fill: '#64748b' }}
          >
            {budgetValue}
          </text>
        )}
        <text
          x={cx}
          y={cy - dyActualValue}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: actualValueSize, fontWeight: 700, fill: color }}
        >
          {centerValue}
        </text>
        <text
          x={cx}
          y={cy - dyActualLabel}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: actualLabelSize, fill: '#64748b' }}
        >
          Actual
        </text>
      </svg>
    </div>
  );
}
