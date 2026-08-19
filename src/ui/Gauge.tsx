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
  centerValue: string;
  /** e.g. "Budget $39.8M" — shown small, stacked above the center value,
   * inside the arc. Keep this short (compact-formatted) — the interior
   * space narrows quickly above the baseline. */
  caption?: string;
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

/** A semicircular speedometer-style gauge: a fixed 0..scaleMax track, a
 * colored arc filled to Actual's position, and a target-line tick marking
 * Budget's position — so Budget reads as a target to hit, not a second
 * bar. Actual and Budget are labeled inside the arc's interior (near the
 * flat baseline, where the half-disk is widest) rather than below the
 * gauge. No charting library needed for one arc + one tick. */
export function Gauge({
  actualFraction,
  budgetFraction,
  color,
  trackColor,
  targetColor = '#1f2937',
  thickness = 12,
  size = 160,
  centerValue,
  caption,
  minLabel,
  maxLabel,
}: GaugeProps) {
  const LABEL_MARGIN = 18; // horizontal room so the min/max scale labels don't clip at the arc's edges
  const r = (size - thickness) / 2;
  const cx = LABEL_MARGIN + size / 2;
  const cy = r + thickness / 2;
  const svgWidth = size + LABEL_MARGIN * 2;
  const svgHeight = cy + 18; // arc + room for the min/max scale labels below it

  const clampedActual = Math.max(0, Math.min(1, actualFraction));
  const clampedBudget = Math.max(0, Math.min(1, budgetFraction));
  const sweep = START_ANGLE - END_ANGLE;
  const valueAngle = START_ANGLE - clampedActual * sweep;
  const budgetAngle = START_ANGLE - clampedBudget * sweep;

  const trackPath = describeArc(cx, cy, r, START_ANGLE, END_ANGLE);
  const valuePath = describeArc(cx, cy, r, START_ANGLE, valueAngle);

  const tickInner = polarToCartesian(cx, cy, r - thickness / 2 - 4, budgetAngle);
  const tickOuter = polarToCartesian(cx, cy, r + thickness / 2 + 4, budgetAngle);

  // Shrinks the center value's font size for long formatted strings (large
  // currency amounts, etc.) so they stay inside the arc's interior — which
  // is narrower than the gauge's full width, since it's bounded by the
  // inner edge of the arc's stroke, not the outer edge.
  const baseFontSize = size * 0.135;
  const COMFORTABLE_CHARS = 6;
  const fontSize =
    centerValue.length > COMFORTABLE_CHARS
      ? Math.max(size * 0.075, baseFontSize * (COMFORTABLE_CHARS / centerValue.length))
      : baseFontSize;
  const captionFontSize = size * 0.07;
  const actualLabelFontSize = size * 0.06;

  // Stacked bottom-up from the baseline (widest point of the interior
  // half-disk, where there's the most room): the "Actual" label sits
  // lowest, the big Actual value above it, and the smaller Budget caption
  // above that — each line has less horizontal room than the one below it.
  const actualLabelY = cy - 10;
  const actualY = actualLabelY - actualLabelFontSize / 2 - fontSize / 2 - 3;
  const captionY = actualY - fontSize / 2 - captionFontSize / 2 - 4;

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
        {caption && (
          <text x={cx} y={captionY} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: captionFontSize, fill: '#64748b' }}>
            {caption}
          </text>
        )}
        <text
          x={cx}
          y={actualY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize, fontWeight: 700, fill: color }}
        >
          {centerValue}
        </text>
        <text
          x={cx}
          y={actualLabelY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: actualLabelFontSize, fill: '#64748b' }}
        >
          Actual
        </text>
      </svg>
    </div>
  );
}
