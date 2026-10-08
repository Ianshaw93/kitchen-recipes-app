"use client";

import { useState } from "react";
import { LISTENING_CHECKLIST_KEY } from "@/lib/relationship";
import {
  LISTENING_GROUPS,
  SPEAKER_LISTENER_CREDIT,
  listeningStepCount,
  listeningSteps,
  type ListeningStep,
} from "@/lib/speaker-listener";
import { useCheckedItems } from "@/lib/use-checked-items";
import { TickBox } from "./TickBox";

type Speaker = "Ian" | "Avery";

export function ListeningChecklist({
  storageKey = LISTENING_CHECKLIST_KEY,
  rounds = false,
}: {
  storageKey?: string;
  rounds?: boolean;
}) {
  const [round, setRound] = useState<1 | 2>(1);
  const [firstSpeaker, setFirstSpeaker] = useState<Speaker>("Ian");
  const activeKey = rounds && round === 2 ? `${storageKey}:round-2` : storageKey;
  const { checked, toggle, reset } = useCheckedItems(activeKey);
  const steps = listeningSteps();
  const done = steps.filter((step) => checked[step.id]).length;
  const speaker: Speaker = round === 1 ? firstSpeaker : otherSpeaker(firstSpeaker);
  const listener = otherSpeaker(speaker);

  return (
    <section aria-labelledby="listening-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="listening-heading" className="font-display text-2xl font-bold">
            Active listening
          </h2>
          <p className="text-sm font-semibold text-ink-soft">{SPEAKER_LISTENER_CREDIT}</p>
          <p className="text-sm font-semibold text-ink-soft">
            Tap to tick · {done}/{listeningStepCount()}
            {rounds ? ` · this round` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="tap shrink-0 rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
        >
          Reset
        </button>
      </div>
      {rounds ? (
        <div className="mb-4 rounded-3xl border-2 border-line/15 bg-paper px-4 py-4">
          <p className="text-base font-extrabold">
            Round {round} · {speaker} is speaking
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">{listener} is listening.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["Ian", "Avery"] as const).map((person) => {
              const selected = firstSpeaker === person;
              return (
                <button
                  key={person}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFirstSpeaker(person)}
                  className={`tap rounded-full border-2 px-3 text-sm font-extrabold uppercase tracking-wide ${
                    selected ? "border-ink bg-ink text-cream" : "border-line/20 bg-cream text-ink"
                  }`}
                >
                  {person} speaks first
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
        {LISTENING_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">
              {group.title}
            </p>
            {group.note ? (
              <p className="mb-2 text-sm font-semibold leading-snug text-ink-soft">{group.note}</p>
            ) : null}
            <StepList steps={group.steps} checked={checked} onToggle={toggle} />
            {group.callouts?.map((callout) => (
              <div
                key={callout.tone}
                className={`mt-2 rounded-3xl border-2 px-3 py-3 ${
                  callout.tone === "do" ? "border-leaf/40 bg-leaf/10" : "border-brick/30 bg-brick/10"
                }`}
              >
                <p
                  className={`mb-2 text-xs font-extrabold uppercase tracking-wide ${
                    callout.tone === "do" ? "text-leaf" : "text-brick"
                  }`}
                >
                  {callout.label}
                </p>
                <StepList steps={callout.steps} checked={checked} onToggle={toggle} bare />
              </div>
            ))}
            {rounds && group.id === "switch" ? (
              <div className="mt-2">
                {round === 1 ? (
                  <button
                    type="button"
                    onClick={() => setRound(2)}
                    className="tap w-full rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
                  >
                    Start round 2
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRound(1)}
                    className="tap w-full rounded-2xl border-2 border-ink bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-ink"
                  >
                    Back to round 1
                  </button>
                )}
                <p className="mt-2 text-sm font-semibold text-ink-soft">
                  Round 2 uses a fresh set of ticks, with {otherSpeaker(firstSpeaker)} speaking.
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function otherSpeaker(person: Speaker): Speaker {
  return person === "Ian" ? "Avery" : "Ian";
}

function StepList({
  steps,
  checked,
  onToggle,
  bare = false,
}: {
  steps: ListeningStep[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
  bare?: boolean;
}) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ol className={bare ? "overflow-hidden rounded-2xl bg-paper/80" : "overflow-hidden rounded-3xl border-2 border-line/15 bg-cream"}>
      {steps.map((step, index) => {
        const isOn = Boolean(checked[step.id]);
        return (
          <li key={step.id} className={index === 0 ? "" : "border-t-2 border-line/10"}>
            <button
              type="button"
              onClick={() => onToggle(step.id)}
              aria-pressed={isOn}
              className="tap flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <TickBox on={isOn} />
              <span
                className={`min-w-0 text-base font-semibold leading-snug ${
                  isOn ? "text-ink-soft line-through" : "text-ink"
                }`}
              >
                {step.text}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
