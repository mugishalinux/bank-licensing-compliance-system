export default function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-bnr border-t-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-16">
      <Spinner size={24} />
    </div>
  );
}
