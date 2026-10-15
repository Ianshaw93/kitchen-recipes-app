import { badgeCountLabel } from "@/lib/behaviour-tags";

export function CountBadge({ count, corner = false }: { count: number; corner?: boolean }) {
  const label = badgeCountLabel(count);
  if (!label) {
    return null;
  }
  return (
    <>
      <span
        aria-hidden="true"
        data-badge-count
        className={`inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-brick px-1 text-[0.65rem] font-extrabold leading-none tracking-normal text-cream tabular-nums ${
          corner ? "absolute top-0.5 right-0.5" : "ml-1.5"
        }`}
      >
        {label}
      </span>
      <span className="sr-only">{`, ${count} new`}</span>
    </>
  );
}
