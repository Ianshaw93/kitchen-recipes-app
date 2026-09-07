export function ChecklistHeader({
  title,
  done,
  total,
  onClear,
}: {
  title: string;
  done: number;
  total: number;
  onClear: () => void;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="text-sm font-semibold text-ink-soft">
          Tap to tick · {done}/{total}
        </p>
      </div>
      {done > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="tap rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
        >
          Clear ticks
        </button>
      ) : null}
    </div>
  );
}
