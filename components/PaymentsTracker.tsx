"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { extractSpendFromScreenshot } from "@/app/payments/actions";
import {
  calculateBalance,
  formatEntryDate,
  formatPounds,
  parseAmountToPence,
  summariseBalance,
  todayISODate,
  type Payer,
  type PaymentEntry,
} from "@/lib/payments";
import { prepareScreenshot } from "@/lib/prepare-screenshot";
import type { ExtractResult } from "@/lib/receipt-draft";
import { usePayments } from "@/lib/use-payments";

const payers: Payer[] = ["Ian", "Avery"];

export function PaymentsTracker({
  extractSpend = extractSpendFromScreenshot,
}: {
  extractSpend?: (formData: FormData) => Promise<ExtractResult>;
} = {}) {
  const { entries, add, remove, hydrated } = usePayments();
  const [paidBy, setPaidBy] = useState<Payer | "">("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [scanning, setScanning] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PaymentEntry | null>(null);

  const balance = calculateBalance(entries);
  const summary = summariseBalance(balance);
  const dateValue = date || (hydrated ? todayISODate() : "");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountPence = parseAmountToPence(amount);
    const trimmedDescription = description.trim();

    if (!paidBy) {
      setError("Pick who paid.");
      return;
    }
    if (!amountPence) {
      setError("Enter an amount in pounds.");
      return;
    }
    if (!trimmedDescription) {
      setError("Say what it was for.");
      return;
    }

    add({
      date: dateValue || todayISODate(),
      description: trimmedDescription,
      amountPence,
      paidBy,
      note,
    });

    setAmount("");
    setDescription("");
    setNote("");
    setError("");
    setDraftNotice("");
    setDate(todayISODate());
  }

  async function onScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setScanning(true);
    setError("");
    setDraftNotice("");

    try {
      const prepared = await prepareScreenshot(file);
      const formData = new FormData();
      formData.set("screenshot", prepared);
      const result = await extractSpend(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.draft.amount) {
        setAmount(result.draft.amount);
      }
      if (result.draft.description) {
        setDescription(result.draft.description);
      }
      if (result.draft.date) {
        setDate(result.draft.date);
      }
      if (result.draft.paidBy) {
        setPaidBy(result.draft.paidBy);
      }
      if (result.draft.note) {
        setNote(result.draft.note);
      }
      setDraftNotice("Draft from screenshot — check then Add spend.");
    } catch {
      setError("Could not read that screenshot. Try another photo or type it in.");
    } finally {
      setScanning(false);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    remove(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <section className="mx-auto max-w-xl px-4 sm:px-6">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold leading-tight">Who paid</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Shared household spends for Ian &amp; Avery.
        </p>
      </div>

      <div
        className={`rounded-3xl border-2 px-5 py-4 card-shadow ${
          balance.status === "settled"
            ? "border-leaf/30 bg-leaf/10"
            : "border-gold/40 bg-gold/15"
        }`}
      >
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
          Settle up
        </p>
        <p className="mt-1 font-display text-2xl font-bold">{summary}</p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Each shared buy splits 50/50.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8">
        <label
          className="tap flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line/25 bg-cream px-4 text-center"
          aria-busy={scanning}
        >
          <span className="text-lg font-extrabold text-ink">
            {scanning ? "Reading screenshot…" : "Fill from screenshot"}
          </span>
          <span className="mt-1 text-sm font-semibold text-ink-soft">
            Receipt, Monzo, or bank screenshot. Check the draft, then add.
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Screenshot of receipt or payment"
            disabled={scanning}
            onChange={onScreenshot}
          />
        </label>

        {draftNotice ? (
          <p className="mt-3 rounded-2xl border-2 border-gold/40 bg-gold/15 px-4 py-3 text-base font-bold">
            {draftNotice}
          </p>
        ) : null}

        <fieldset className="mt-6">
          <legend className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Who paid
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {payers.map((person) => {
              const selected = paidBy === person;
              return (
                <button
                  key={person}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPaidBy(person)}
                  className={`tap rounded-2xl border-2 text-xl font-extrabold ${
                    selected
                      ? "border-brick bg-brick text-cream"
                      : "border-line/20 bg-cream text-ink"
                  }`}
                >
                  {person}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Amount (£)
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="12.50"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            What it was for
          </span>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tesco shop"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Date</span>
          <input
            type="date"
            value={dateValue}
            onChange={(event) => setDate(event.target.value)}
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Note <span className="normal-case tracking-normal">(optional)</span>
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything else"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        {error ? (
          <p className="mt-3 text-base font-bold text-brick" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="tap mt-6 w-full rounded-2xl bg-brick text-xl font-extrabold text-cream"
        >
          Add spend
        </button>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold">Entries</h2>
        {entries.length === 0 ? (
          <p className="mt-3 rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
            Nothing logged yet. Shared 50/50. Whoever didn&apos;t pay owes half.
          </p>
        ) : (
          <ol className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={`flex items-start gap-3 px-4 py-4 ${
                  index === 0 ? "" : "border-t-2 border-line/10"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                    {formatEntryDate(entry.date)}
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight">{entry.description}</p>
                  <p className="mt-1 text-base font-bold">
                    {formatPounds(entry.amountPence)}
                    <span className="font-semibold text-ink-soft"> · Paid by {entry.paidBy}</span>
                  </p>
                  {entry.note ? (
                    <p className="mt-1 text-sm font-semibold text-ink-soft">{entry.note}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(entry)}
                  className="tap shrink-0 rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-brick"
                  aria-label={`Delete ${entry.description}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-spend-title"
            className="mb-2 w-full max-w-xl rounded-3xl border-2 border-line/15 bg-cream p-5 card-shadow"
          >
            <h2 id="remove-spend-title" className="font-display text-2xl font-bold">
              Remove this spend?
            </h2>
            <p className="mt-2 text-base font-semibold text-ink-soft">
              {pendingDelete.description} · {formatPounds(pendingDelete.amountPence)} · Paid by{" "}
              {pendingDelete.paidBy}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="tap rounded-2xl border-2 border-line/20 bg-paper text-lg font-extrabold text-ink"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="tap rounded-2xl bg-brick text-lg font-extrabold text-cream"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
