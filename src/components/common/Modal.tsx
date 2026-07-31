import type { ReactNode } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal panel"
        style={wide ? { width: 'min(920px, 100%)' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
