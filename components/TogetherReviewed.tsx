"use client";

import { useState } from "react";
import { TickBox } from "@/components/TickBox";
import {
  Card,
  EmptyState,
  Field,
  Meta,
  PrimaryButton,
  QuietButton,
  SectionHeading,
  SubHeading,
  TextArea,
} from "@/components/UsUi";
import { useSharedRelationship } from "@/lib/relationship-context";
import {
  STATE_OF_THE_UNION_STEPS,
  addReview,
  addStandardsFromReview,
  formatISODate,
  todayISODate,
  type ReviewedTogether,
} from "@/lib/relationship";
import { useCheckedItems } from "@/lib/use-checked-items";

function reviewLines(review: ReviewedTogether): string[] {
  return review.standardsAgreed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function TogetherReviewed() {
  const { document: notes, hydrated, save } = useSharedRelationship();
  const [reviewTakeaways, setReviewTakeaways] = useState("");
  const [reviewStandards, setReviewStandards] = useState("");
  const checkIn = useCheckedItems("kusina:checked:steps:us-check-in");
  const onCheckIn = new Set(notes?.checkInStandards.map((item) => item.text) ?? []);

  return (
    <>
      <section
        aria-labelledby="sotu-heading"
        className="rounded-3xl border border-gold/30 bg-gold/[0.12] px-5 py-5"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Weekly prompt</p>
        <h2 id="sotu-heading" className="mt-1 font-display text-2xl font-bold leading-tight">
          State of the Union
        </h2>
        <ol className="mt-4 space-y-3">
          {STATE_OF_THE_UNION_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream font-display text-sm font-bold text-brick"
              >
                {index + 1}
              </span>
              <span className="min-w-0 pt-0.5 text-base leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="reviewed-heading" className="space-y-5">
        <SectionHeading id="reviewed-heading" eyebrow="Log" title="Reviewed together">
          Date, takeaways, and any new standards you agreed. Add a standard to the check-in list so
          it is not forgotten.
        </SectionHeading>
        <Card>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!reviewTakeaways.trim()) {
                return;
              }
              void save((current) =>
                addReview(current, {
                  date: todayISODate(),
                  takeaways: reviewTakeaways,
                  standardsAgreed: reviewStandards,
                }),
              ).then((ok) => {
                if (ok) {
                  setReviewTakeaways("");
                  setReviewStandards("");
                }
              });
            }}
          >
            <Field label="Takeaways">
              <TextArea value={reviewTakeaways} onChange={(event) => setReviewTakeaways(event.target.value)} />
            </Field>
            <Field label="Standards agreed">
              <TextArea
                value={reviewStandards}
                onChange={(event) => setReviewStandards(event.target.value)}
                placeholder="One line each"
              />
            </Field>
            <PrimaryButton>Save review</PrimaryButton>
          </form>
        </Card>

        <div className="pt-2">
          {!hydrated || !notes ? (
            <EmptyState>Loading reviews…</EmptyState>
          ) : notes.reviews.length === 0 ? (
            <EmptyState>No sit-downs logged yet.</EmptyState>
          ) : (
            <ol className="space-y-3">
              {notes.reviews.map((review) => {
                const lines = reviewLines(review);
                const added = lines.length > 0 && lines.every((line) => onCheckIn.has(line));
                return (
                  <li key={review.id}>
                    <Card>
                      <Meta>{formatISODate(review.date)}</Meta>
                      <p className="mt-1.5 text-lg font-semibold leading-snug">{review.takeaways}</p>
                      {lines.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-base leading-snug text-ink-soft">
                          {lines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : null}
                      {review.standardsAgreed.trim() ? (
                        <QuietButton
                          className="-mx-3 mt-1"
                          disabled={added}
                          onClick={() => void save((current) => addStandardsFromReview(current, review.id))}
                        >
                          {added ? "✓ On the check-in list" : "Add as standard to check-in list"}
                        </QuietButton>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <SubHeading>Check-in list</SubHeading>
          {!notes || notes.checkInStandards.length === 0 ? (
            <EmptyState>Agreed standards show up here after you add them from a review or a plan.</EmptyState>
          ) : (
            <ul className="overflow-hidden rounded-3xl border border-line/10 bg-cream card-shadow">
              {notes.checkInStandards.map((item, index) => {
                const on = Boolean(checkIn.checked[item.id]);
                return (
                  <li key={item.id} className={index === 0 ? "" : "border-t border-line/10"}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => checkIn.toggle(item.id)}
                      className="tap flex w-full items-start gap-3 px-4 py-3 text-left"
                    >
                      <TickBox on={on} />
                      <span
                        className={`pt-1 text-base font-semibold leading-snug ${on ? "text-ink-soft line-through" : "text-ink"}`}
                      >
                        {item.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
