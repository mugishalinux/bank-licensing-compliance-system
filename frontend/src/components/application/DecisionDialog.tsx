import { useState } from 'react';
import Modal from '../common/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { comment: string }) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  destructive?: boolean;
  minLength?: number;
  placeholder?: string;
}

export default function DecisionDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  confirmLabel,
  busy,
  destructive,
  minLength = 10,
  placeholder = 'Explain your decision…',
}: Props) {
  const [comment, setComment] = useState('');

  const reset = () => { setComment(''); onClose(); };

  return (
    <Modal
      open={open}
      onClose={reset}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={reset} disabled={busy}>Cancel</button>
          <button
            className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onSubmit({ comment: comment.trim() })}
            disabled={busy || comment.trim().length < minLength}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[13px] text-[color:var(--color-ink-soft)] mb-3">{description}</p>
      <label className="label">Note for the applicant</label>
      <textarea
        rows={5}
        className="textarea"
        placeholder={placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <p className="text-[11px] text-[color:var(--color-ink-soft)] mt-1.5">
        Minimum {minLength} characters. This will be visible to the applicant.
      </p>
    </Modal>
  );
}
