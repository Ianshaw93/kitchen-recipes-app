import { OUR_STANDARDS } from "@/lib/our-standards";

export function OurStandards() {
  return (
    <section
      aria-labelledby="standards-heading"
      className="rounded-3xl border-2 border-ink bg-cream px-4 py-5 card-shadow"
    >
      <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">
        Non-negotiables
      </p>
      <h2 id="standards-heading" className="mt-1 font-display text-3xl font-bold tracking-tight">
        Our standards
      </h2>
      <ol className="mt-4 space-y-4">
        {OUR_STANDARDS.map((standard, index) => (
          <li key={standard} className="flex gap-3">
            <span className="font-display text-2xl font-bold leading-none text-brick" aria-hidden="true">
              {index + 1}
            </span>
            <p className="min-w-0 text-base font-semibold leading-snug">{standard}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
