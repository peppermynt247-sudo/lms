export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin"
          style={{ borderTopColor: '#ff5b00' }}
        />
        <p className="text-sm font-semibold text-gray-400 tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
