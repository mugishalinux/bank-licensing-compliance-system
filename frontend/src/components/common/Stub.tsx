export default function Stub({ title }: { title: string }) {
  return (
    <div className="card p-8">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-[color:var(--color-ink-soft)] mt-1">Coming up.</p>
    </div>
  );
}
