"use client";

import { type FormEvent, useEffect, useState } from "react";
import { BehaviourTagItem } from "@/components/BehaviourTagItem";
import {
  AddDisclosure,
  ChoiceRow,
  EmptyState,
  Field,
  PrimaryButton,
  QuietButton,
  SectionHeading,
  TextInput,
} from "@/components/UsUi";
import {
  HORSEMAN_IDS,
  TAG_WHO,
  sortTagsNewestFirst,
  type BehaviourTag,
  type HorsemanId,
  type TagKind,
  type TagWho,
} from "@/lib/behaviour-tags";
import { HORSEMEN } from "@/lib/horsemen";
import { filterMoments, momentPatternLabel, type MomentDraft, type MomentFilter } from "@/lib/moments";
import { createMoment, deleteMoment, fetchMoments } from "@/lib/moments-client";

const PREVIEW_COUNT = 6;
const FILTERS: { value: MomentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ian", label: "Ian" },
  { value: "avery", label: "Avery" },
];
const WHO_NAMES: Record<TagWho, string> = { ian: "Ian", avery: "Avery", both: "Both" };
const KIND_NAMES: Record<TagKind, string> = { win: "Win", slip: "Slip" };
const KIND_OPTIONS: readonly TagKind[] = ["win", "slip"];

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; moments: BehaviourTag[] };

export function TogetherMoments() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [filter, setFilter] = useState<MomentFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [who, setWho] = useState<TagWho>("both");
  const [kind, setKind] = useState<TagKind>("win");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [horseman, setHorseman] = useState<HorsemanId | "">("");

  useEffect(() => {
    let active = true;
    fetchMoments()
      .then((moments) => {
        if (active) {
          setLoad({ status: "ready", moments: sortTagsNewestFirst(moments) });
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: "error" });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const moments = load.status === "ready" ? load.moments : [];
  const filtered = filterMoments(moments, filter);
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }
    const draft: MomentDraft = { who, kind, text: text.trim() };
    if (date) {
      draft.date = date;
    }
    if (horseman) {
      draft.horseman = horseman;
    }
    try {
      const moment = await createMoment(draft);
      setLoad((current) => ({
        status: "ready",
        moments: sortTagsNewestFirst([moment, ...(current.status === "ready" ? current.moments : [])]),
      }));
      setProblem(null);
      setText("");
      setDate("");
      setHorseman("");
    } catch {
      setProblem("Couldn't add the moment. Try again.");
    }
  }

  async function remove(id: string) {
    try {
      await deleteMoment(id);
      setLoad((current) =>
        current.status === "ready"
          ? { status: "ready", moments: current.moments.filter((moment) => moment.id !== id) }
          : current,
      );
      setProblem(null);
    } catch {
      setProblem("Couldn't delete the moment. Try again.");
    }
  }

  return (
    <section aria-labelledby="moments-heading" className="space-y-4">
      <SectionHeading id="moments-heading" eyebrow="Wins and slips" title="Moments">
        Good and bad behaviours, newest first. Add one whenever you notice it.
      </SectionHeading>

      <div
        role="group"
        aria-label="Show moments for"
        className="grid grid-cols-3 gap-1 rounded-full border border-line/10 bg-paper-deep/50 p-1"
      >
        {FILTERS.map((option) => {
          const selected = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setFilter(option.value);
                setShowAll(false);
              }}
              className={`min-h-11 rounded-full text-sm font-bold transition-colors ${
                selected ? "bg-cream text-brick shadow-[0_1px_2px_rgb(28_16_8/0.12)]" : "text-ink-soft"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {problem ? (
        <p role="alert" className="rounded-2xl bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
          {problem}
        </p>
      ) : null}

      {load.status === "loading" ? (
        <EmptyState>Loading moments…</EmptyState>
      ) : load.status === "error" ? (
        <EmptyState>Couldn&apos;t load moments right now.</EmptyState>
      ) : moments.length === 0 ? (
        <EmptyState>No moments yet. Add one below.</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>{`No moments for ${filter === "ian" ? "Ian" : "Avery"} yet.`}</EmptyState>
      ) : (
        <ul aria-label="Moments" className="space-y-2">
          {visible.map((moment) => (
            <BehaviourTagItem
              key={moment.id}
              tag={moment}
              pattern={momentPatternLabel(moment)}
              actions={
                <div className="-mx-3 -mb-1.5">
                  <QuietButton tone="brick" aria-label={`Delete moment ${moment.text}`} onClick={() => void remove(moment.id)}>
                    Delete
                  </QuietButton>
                </div>
              }
            />
          ))}
        </ul>
      )}
      {filtered.length > PREVIEW_COUNT ? (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
          className="flex min-h-12 w-full items-center justify-center rounded-full text-base font-bold text-ocean"
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length}`}
        </button>
      ) : null}

      <AddDisclosure summary="Add a moment">
        <form onSubmit={(event) => void add(event)}>
          <ChoiceRow legend="Who" value={who} options={TAG_WHO} nameFor={(option) => `Who ${WHO_NAMES[option]}`} onChange={setWho} />
          <ChoiceRow legend="Win or slip" value={kind} options={KIND_OPTIONS} nameFor={(option) => KIND_NAMES[option]} onChange={setKind} />
          <Field label="What happened">
            <TextInput value={text} onChange={(event) => setText(event.target.value)} placeholder="Short and specific" />
          </Field>
          <Field label="Date (optional)">
            <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Horseman (optional)">
            <select
              value={horseman}
              onChange={(event) => setHorseman(event.target.value as HorsemanId | "")}
              className="mt-1.5 min-h-12 w-full rounded-2xl border border-line/15 bg-paper/30 px-4 text-base text-ink focus:border-brick/50 focus:outline-none focus:ring-4 focus:ring-brick/10"
            >
              <option value="">None</option>
              {HORSEMAN_IDS.map((id) => {
                const card = HORSEMEN.find((item) => item.id === id);
                return (
                  <option key={id} value={id}>
                    {card ? `${card.horseman} · ${card.positive}` : id}
                  </option>
                );
              })}
            </select>
          </Field>
          <PrimaryButton>Add moment</PrimaryButton>
        </form>
      </AddDisclosure>
    </section>
  );
}
