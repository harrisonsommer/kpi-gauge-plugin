import type { CSSProperties } from 'react';

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
  /** e.g. "Budget $39,818,339" — shown small, under the center value. */
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
 * bar. No charting library needed for one arc + one tick. */
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
  // currency amounts, etc.) so they stay inside the gauge's width.
  const baseFontSize = size * 0.155;
  const COMFORTABLE_CHARS = 7;
  const fontSize =
    centerValue.length > COMFORTABLE_CHARS
      ? Math.max(size * 0.08, baseFontSize * (COMFORTABLE_CHARS / centerValue.length))
      : baseFontSize;

  const labelStyle: CSSProperties = { fontSize: 10, fill: '#94a3b8' };

  return (
    <div style={{ width: svgWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
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
      </svg>
      <div style={{ fontSize: Math.round(fontSize), fontWeight: 700, color, lineHeight: 1.1, textAlign: 'center' }}>
        {centerValue}
      </div>
      {caption && <div style={{ fontSize: Math.round(size * 0.075), opacity: 0.55, marginTop: 2, textAlign: 'center' }}>{caption}</div>}
    </div>
  );
}
