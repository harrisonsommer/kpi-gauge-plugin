import type { CSSProperties, ReactNode } from 'react';

/** Strict two-column row: a label and one control. The workhorse of the
 * settings panel's simple fields (dropdowns, checkboxes, single inputs). */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <label style={{ opacity: 0.8, flex: 1 }}>{label}</label>
      {children}
    </div>
  );
}

export const INPUT_STYLE: CSSProperties = { width: 90 };
export const PRIMARY_BUTTON_STYLE: CSSProperties = { padding: '5px 10px', border: 'none', borderRadius: 4, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 11 };
export const SECONDARY_BUTTON_STYLE: CSSProperties = { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer', fontSize: 11 };
export const CLOSE_BUTTON_STYLE: CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 };
