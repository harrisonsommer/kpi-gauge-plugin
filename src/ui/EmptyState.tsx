export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(248, 250, 252, 0.92)',
        color: '#475569',
        textAlign: 'center',
        padding: 16,
        zIndex: 4,
      }}
    >
      <div style={{ maxWidth: 260 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1e293b' }}>{title}</div>
        {message && <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>{message}</div>}
      </div>
    </div>
  );
}
