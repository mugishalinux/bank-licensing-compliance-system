import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const w = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative card w-full ${w} max-h-[90vh] flex flex-col shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
          <h2 className="font-semibold text-[15px]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-bnr-soft text-[color:var(--color-ink-soft)]">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[color:var(--color-bnr-line)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
