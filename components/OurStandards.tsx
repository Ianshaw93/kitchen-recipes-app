import { OUR_STANDARDS } from "@/lib/our-standards";

export function OurStandards() {
  return (
    <section
      aria-labelledby="standards-heading"
      className="rounded-3xl border border-line/10 bg-cream px-5 py-6 card-shadow"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brick">Non-negotiables</p>
      <h2 id="standards-heading" className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight">
        Our standards
      </h2>
      <ol className="mt-5 divide-y divide-line/10">
        {OUR_STANDARDS.map((standard, index) => (
          <li key={standard} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brick/10 font-display text-lg font-bold text-brick"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <p className="min-w-0 pt-1 text-[1.0625rem] leading-relaxed">{standard}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
