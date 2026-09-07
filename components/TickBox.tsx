export function TickBox({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
        on ? "border-leaf bg-leaf text-cream" : "border-line/30 bg-paper"
      }`}
      aria-hidden="true"
    >
      {on ? (
        <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none">
          <path
            d="M3 8.5 6.2 12 13 4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
