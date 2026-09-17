import { TripPhoto } from "@/components/TripPhoto";
import { accentClass } from "@/lib/accents";
import {
  BUDGET_BANDS,
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_ORDER,
  categoryAmountsForBand,
  formatGbp,
  legAmountForBand,
  selectedBandAmount,
  type BudgetCategoryId,
  type Trip,
} from "@/lib/trips";

const categoryBarClass: Record<BudgetCategoryId, string> = {
  rooms: "bg-brick",
  food: "bg-ginger",
  transport: "bg-ocean",
  activities: "bg-leaf",
  misc: "bg-gold",
  contingency: "bg-chili",
};

export function TripBudget({ trip }: { trip: Trip }) {
  const band = trip.selectedBand;
  const total = selectedBandAmount(trip, band);
  const categories = categoryAmountsForBand(trip, band);

  return (
    <div className="mt-8 space-y-8">
      <section aria-label="On-ground bands" role="group">
        <h2 className="font-display text-2xl font-bold">On-ground bands</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Planning against Buffer. Lean and comfort stay visible. Flights are out.
        </p>
        <ol className="mt-4 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
          {BUDGET_BANDS.map((item, index) => {
            const selected = item.id === band;
            const amount =
              item.id === "lean"
                ? trip.budgetOnGroundLeanGbp
                : item.id === "comfort"
                  ? trip.budgetOnGroundComfortGbp
                  : trip.budgetBufferGbp;

            return (
              <li
                key={item.id}
                data-selected={selected ? "true" : undefined}
                className={`px-4 py-4 ${index === 0 ? "" : "border-t-2 border-line/10"} ${
                  selected ? "bg-gold/20" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold leading-snug">{item.label}</p>
                    <p className="text-sm font-semibold text-ink-soft">{item.hint}</p>
                  </div>
                  <p className="shrink-0 font-display text-2xl font-bold">{formatGbp(amount)}</p>
                </div>
                {selected ? (
                  <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-brick">
                    Selected
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <aside className="rounded-3xl border-2 border-leaf/30 bg-leaf/10 px-4 py-4">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-leaf">
          Already paid
        </p>
        {trip.alreadyPaid.map((item) => (
          <div key={item.label} className="mt-1">
            <p className="font-display text-2xl font-bold">
              {item.label} · {item.status === "paid" ? "Paid" : item.status}
            </p>
            <p className="text-sm font-semibold text-ink-soft">{item.note}</p>
          </div>
        ))}
      </aside>

      <aside className="rounded-3xl border-2 border-gold/40 bg-gold/15 px-4 py-4">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
          Spend on
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">{trip.spendOn}</p>
      </aside>

      <section>
        <h2 className="font-display text-2xl font-bold">By category</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Split of the selected {formatGbp(total)} on-ground band. Contingency is explicit.
        </p>
        <div
          className="mt-4 flex h-4 overflow-hidden rounded-full border-2 border-line/15"
          aria-hidden="true"
        >
          {BUDGET_CATEGORY_ORDER.map((id) => (
            <span
              key={id}
              className={categoryBarClass[id]}
              style={{ width: `${(categories[id] / total) * 100}%` }}
            />
          ))}
        </div>
        <ol className="mt-4 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
          {BUDGET_CATEGORY_ORDER.map((id, index) => (
            <li
              key={id}
              className={`flex items-baseline justify-between gap-3 px-4 py-4 ${
                index === 0 ? "" : "border-t-2 border-line/10"
              }`}
            >
              <p className="text-base font-semibold leading-snug">{BUDGET_CATEGORY_LABELS[id]}</p>
              <p className="shrink-0 text-right">
                <span className="font-display text-xl font-bold">{formatGbp(categories[id])}</span>
                <span className="ml-2 text-sm font-semibold text-ink-soft">
                  {Math.round((categories[id] / total) * 100)}%
                </span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">By place</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          North route seeded. Koh Kood is the island alternative to Chiang Rai — pick one.
        </p>
        <ul className="mt-4 space-y-3">
          {trip.legs.map((leg) => {
            const amount = legAmountForBand(trip, leg, band);
            const nightsLabel = leg.nights === 1 ? "1 night" : `${leg.nights} nights`;

            return (
              <li
                key={leg.id}
                className={`overflow-hidden rounded-3xl border-2 bg-cream card-shadow ${
                  leg.kind === "alt" ? "border-dashed border-line/30" : "border-line/15"
                }`}
              >
                <TripPhoto src={leg.imageSrc} alt={leg.imageAlt} credit={leg.imageCredit} />
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {leg.kind === "alt" ? (
                        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-ink-soft">
                          Alt to Chiang Rai
                        </p>
                      ) : null}
                      <h3 className="font-display text-xl font-bold leading-tight">{leg.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-ink-soft">
                        {nightsLabel} · {leg.note}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold ${accentClass[trip.accent].chip}`}
                    >
                      {formatGbp(amount)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
