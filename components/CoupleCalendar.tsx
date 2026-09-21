"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  WEEKDAY_LABELS,
  calendarMonth,
  eventsOnDate,
  formatDayLabel,
  formatEventWhen,
  parseISODate,
  shiftMonth,
  todayISODate,
  upcomingEvents,
  type CalendarEvent,
  type CalendarEventDraft,
  type CalendarWho,
} from "@/lib/calendar";
import { useCalendar } from "@/lib/use-calendar";

const whoOptions: CalendarWho[] = ["Ian", "Avery", "Both"];

type CoupleCalendarProps = {
  today?: string;
  focusDate?: string | null;
};

const emptyDraft = {
  title: "",
  startDate: "",
  endDate: "",
  allDay: true,
  startTime: "",
  note: "",
  who: "Both" as CalendarWho,
};

export function CoupleCalendarRoute() {
  const searchParams = useSearchParams();
  return <CoupleCalendar focusDate={searchParams.get("date")} />;
}

export function CoupleCalendar({ today, focusDate }: CoupleCalendarProps = {}) {
  const { events, add, update, remove, hydrated, syncError } = useCalendar();
  const todayValue = today || (hydrated ? todayISODate() : "");
  const [visible, setVisible] = useState(() => {
    const iso = isIsoDate(focusDate) ? focusDate : today || todayISODate();
    const parsed = parseISODate(iso);
    return { year: parsed?.year ?? 2026, month: parsed?.month ?? 9 };
  });
  const [selectedDate, setSelectedDate] = useState(isIsoDate(focusDate) ? focusDate : today || "");
  const [form, setForm] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!form.startDate && !editingId) {
      setForm((current) => ({ ...current, startDate: todayValue || todayISODate() }));
    }

    if (!selectedDate && todayValue) {
      setSelectedDate(todayValue);
    }
  }, [editingId, form.startDate, hydrated, selectedDate, todayValue]);

  const month = useMemo(() => calendarMonth(visible.year, visible.month), [visible.month, visible.year]);
  const comingUp = upcomingEvents(events, todayValue || "9999-12-31");
  const selectedEvents = selectedDate ? eventsOnDate(events, selectedDate) : [];
  const startValue = form.startDate || todayValue;

  function fillForm(event?: CalendarEvent, startDate = startValue) {
    if (!event) {
      setEditingId(null);
      setForm({
        ...emptyDraft,
        startDate,
      });
      return;
    }

    setEditingId(event.id);
    setForm({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate ?? "",
      allDay: event.allDay,
      startTime: event.startTime ?? "",
      note: event.note ?? "",
      who: event.who,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Give it a title.");
      return;
    }
    if (!startValue) {
      setError("Pick a start date.");
      return;
    }

    const draft: CalendarEventDraft = {
      title,
      startDate: startValue,
      allDay: form.allDay,
      who: form.who,
    };
    if (form.endDate && form.endDate >= startValue) {
      draft.endDate = form.endDate;
    }
    if (!form.allDay && form.startTime) {
      draft.startTime = form.startTime;
    }
    if (form.note.trim()) {
      draft.note = form.note.trim();
    }

    setError("");
    const saved = editingId ? await update(editingId, draft) : await add(draft);
    if (saved) {
      fillForm(undefined, todayValue || todayISODate());
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    await remove(pendingDelete.id);
    if (editingId === pendingDelete.id) {
      fillForm(undefined, todayValue || todayISODate());
    }
    setPendingDelete(null);
  }

  return (
    <section className="mx-auto max-w-xl px-4 sm:px-6">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold leading-tight">Calendar</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Same events on both phones. Shared dates for Ian &amp; Avery.
        </p>
      </div>

      {syncError ? (
        <p className="mb-4 rounded-3xl border-2 border-brick/30 bg-brick/10 px-5 py-3 text-base font-bold" role="alert">
          {syncError}
        </p>
      ) : null}

      <div className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-4 card-shadow">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setVisible((current) => shiftMonth(current.year, current.month, -1))}
            className="tap rounded-2xl border-2 border-line/20 bg-paper px-3 text-sm font-extrabold uppercase tracking-wide"
            aria-label="Previous month"
          >
            Prev
          </button>
          <h2 className="font-display text-xl font-bold">{month.title}</h2>
          <button
            type="button"
            onClick={() => setVisible((current) => shiftMonth(current.year, current.month, 1))}
            className="tap rounded-2xl border-2 border-line/20 bg-paper px-3 text-sm font-extrabold uppercase tracking-wide"
            aria-label="Next month"
          >
            Next
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-extrabold uppercase tracking-wide text-ink-soft">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {month.cells.map((cell) => {
            const dayEvents = eventsOnDate(events, cell.iso);
            const selected = selectedDate === cell.iso;
            const isToday = cell.iso === todayValue;
            return (
              <button
                key={cell.iso}
                type="button"
                aria-label={formatDayLabel(cell.iso)}
                aria-pressed={selected}
                data-has-events={dayEvents.length > 0 ? "true" : "false"}
                onClick={() => {
                  setSelectedDate(cell.iso);
                  if (!editingId) {
                    setForm((current) => ({ ...current, startDate: cell.iso }));
                  }
                }}
                className={`relative flex min-h-11 flex-col items-center justify-center rounded-2xl border-2 text-sm font-extrabold ${
                  selected
                    ? "border-brick bg-brick text-cream"
                    : isToday
                      ? "border-gold/50 bg-gold/15 text-ink"
                      : cell.inMonth
                        ? "border-transparent bg-paper text-ink"
                        : "border-transparent bg-transparent text-ink-soft/60"
                }`}
              >
                {cell.day}
                {dayEvents.length > 0 ? (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-cream" : "bg-brick"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="mt-0.5 h-1.5 w-1.5" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedEvents.length > 0 ? (
        <div className="mt-4 rounded-3xl border-2 border-gold/30 bg-gold/10 px-4 py-3">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
            {formatDayLabel(selectedDate)}
          </p>
          <ul className="mt-2 space-y-1">
            {selectedEvents.map((event) => (
              <li key={event.id} className="text-base font-semibold">
                {event.title}
                <span className="font-semibold text-ink-soft"> · {event.who}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8" aria-busy={!hydrated}>
        <h2 className="font-display text-2xl font-bold">Coming up</h2>
        {!hydrated && events.length === 0 ? (
          <p className="mt-3 rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
            Loading shared calendar…
          </p>
        ) : comingUp.length === 0 ? (
          <p className="mt-3 rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
            Nothing coming up yet. Add a date you both need to remember.
          </p>
        ) : (
          <ol className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
            {comingUp.map((event, index) => (
              <li
                key={event.id}
                className={`flex items-start gap-3 px-4 py-4 ${index === 0 ? "" : "border-t-2 border-line/10"}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                    {formatEventWhen(event)}
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight">{event.title}</p>
                  <p className="mt-1 text-sm font-bold text-ink-soft">{whoLabel(event.who)}</p>
                  {event.note ? <p className="mt-1 text-sm font-semibold text-ink-soft">{event.note}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      fillForm(event);
                      const parsed = parseISODate(event.startDate);
                      if (parsed) {
                        setVisible({ year: parsed.year, month: parsed.month });
                        setSelectedDate(event.startDate);
                      }
                    }}
                    className="tap rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-ocean"
                    aria-label={`Edit ${event.title}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(event)}
                    className="tap rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-brick"
                    aria-label={`Delete ${event.title}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-8">
        <h2 className="font-display text-2xl font-bold">{editingId ? "Edit event" : "Add event"}</h2>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Title</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Dinner, scan, trip…"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Start date</span>
            <input
              type="date"
              value={startValue}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-3 text-base font-semibold text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
              End date <span className="normal-case tracking-normal">(optional)</span>
            </span>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-3 text-base font-semibold text-ink"
            />
          </label>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-line/20 bg-cream px-4 py-3">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked }))}
            className="h-5 w-5 accent-brick"
          />
          <span className="text-base font-extrabold">All-day</span>
        </label>

        {form.allDay ? null : (
          <label className="mt-5 block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
              Time <span className="normal-case tracking-normal">(optional)</span>
            </span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
            />
          </label>
        )}

        <fieldset className="mt-5">
          <legend className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Who</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {whoOptions.map((person) => {
              const selected = form.who === person;
              return (
                <button
                  key={person}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setForm((current) => ({ ...current, who: person }))}
                  className={`tap rounded-2xl border-2 text-base font-extrabold ${
                    selected ? "border-brick bg-brick text-cream" : "border-line/20 bg-cream text-ink"
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
            Note <span className="normal-case tracking-normal">(optional)</span>
          </span>
          <input
            type="text"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder="Anything else"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>

        {error ? (
          <p className="mt-3 text-base font-bold text-brick" role="alert">
            {error}
          </p>
        ) : null}

        <div className={editingId ? "mt-6 grid grid-cols-2 gap-3" : "mt-6"}>
          {editingId ? (
            <button
              type="button"
              onClick={() => fillForm(undefined, todayValue || todayISODate())}
              className="tap rounded-2xl border-2 border-line/20 bg-paper text-xl font-extrabold text-ink"
            >
              Cancel
            </button>
          ) : null}
          <button type="submit" className="tap w-full rounded-2xl bg-brick text-xl font-extrabold text-cream">
            {editingId ? "Save event" : "Add event"}
          </button>
        </div>
      </form>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-event-title"
            className="mb-2 w-full max-w-xl rounded-3xl border-2 border-line/15 bg-cream p-5 card-shadow"
          >
            <h2 id="remove-event-title" className="font-display text-2xl font-bold">
              Remove this event?
            </h2>
            <p className="mt-2 text-base font-semibold text-ink-soft">
              {pendingDelete.title} · {formatEventWhen(pendingDelete)}
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

function whoLabel(who: CalendarWho): string {
  if (who === "Both") {
    return "Both of you";
  }
  return who;
}

function isIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
