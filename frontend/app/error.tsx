"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-slate-400 mb-4">{error.message}</p>
      <button className="px-3 py-1.5 bg-accent-600 rounded text-sm" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
