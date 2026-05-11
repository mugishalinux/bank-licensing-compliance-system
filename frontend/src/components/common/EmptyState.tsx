interface Props {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      {icon && <div className="text-[color:var(--color-ink-soft)] mb-3">{icon}</div>}
      <div className="font-medium">{title}</div>
      {message && <p className="text-[13px] text-[color:var(--color-ink-soft)] mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
