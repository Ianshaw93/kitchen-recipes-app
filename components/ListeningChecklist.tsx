"use client";

import { LISTENING_CHECKLIST_KEY, type SessionPlanDraft, type Whose } from "@/lib/relationship";
import {
  LISTENING_GROUPS,
  PLAN_NOTEPAD_PROMPT,
  SPEAKER_LISTENER_CREDIT,
  SPEAKER_PROMPT,
  listeningStepCount,
  requiredListeningSteps,
  type ListeningStep,
} from "@/lib/speaker-listener";
import { useCheckedItems } from "@/lib/use-checked-items";
import { TickBox } from "./TickBox";

const PLAN_WHO: readonly Whose[] = ["Ian", "Avery", "Both"];

export function ListeningChecklist({
  storageKey = LISTENING_CHECKLIST_KEY,
  plan,
  onPlanChange,
  notepadPlan = false,
}: {
  storageKey?: string;
  plan?: SessionPlanDraft;
  onPlanChange?: (plan: SessionPlanDraft) => void;
  notepadPlan?: boolean;
}) {
  const { checked, toggle, reset } = useCheckedItems(storageKey);
  const required = requiredListeningSteps();
  const done = required.filter((step) => checked[step.id]).length;
  const planOpen = Boolean(checked["if-plan"] && plan && onPlanChange);

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
      <p className="mb-4 rounded-3xl border-2 border-line/15 bg-cream px-4 py-4 text-base font-semibold leading-snug">
        {SPEAKER_PROMPT}
      </p>
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
                {callout.tickable ? (
                  <StepList steps={callout.steps} checked={checked} onToggle={toggle} bare />
                ) : (
                  <ul className="space-y-2 px-1 pb-1">
                    {callout.steps.map((step) => (
                      <li key={step.id} className="text-base font-semibold leading-snug">
                        {step.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {notepadPlan && group.id === "if-relevant" ? (
              <p className="mt-2 text-sm font-semibold leading-snug text-ink-soft">{PLAN_NOTEPAD_PROMPT}</p>
            ) : null}
            {planOpen && plan && onPlanChange && group.id === "if-relevant" ? (
              <PlanEditor plan={plan} onChange={onPlanChange} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanEditor({
  plan,
  onChange,
}: {
  plan: SessionPlanDraft;
  onChange: (plan: SessionPlanDraft) => void;
}) {
  function updateAction(id: string, patch: Partial<SessionPlanDraft["actions"][number]>) {
    onChange({
      ...plan,
      actions: plan.actions.map((action) => (action.id === id ? { ...action, ...patch } : action)),
    });
  }

  return (
    <div className="mt-3 rounded-3xl border-2 border-line/15 bg-paper px-4 py-4">
      <p className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Plan for this session</p>
      {plan.actions.map((action, index) => (
        <div key={action.id} className={index === 0 ? "" : "mt-4 border-t-2 border-line/10 pt-3"}>
          <label className="mt-3 block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Action</span>
            <input
              value={action.action}
              onChange={(event) => updateAction(action.id, { action: event.target.value })}
              className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink"
            />
          </label>
          <fieldset className="mt-3">
            <legend className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Who</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PLAN_WHO.map((person) => {
                const selected = action.who === person;
                return (
                  <button
                    key={person}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Plan ${person}`}
                    onClick={() => updateAction(action.id, { who: person })}
                    className={`tap rounded-2xl border-2 text-sm font-extrabold ${
                      selected ? "border-brick bg-brick text-cream" : "border-line/20 bg-cream text-ink"
                    }`}
                  >
                    {person}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="mt-3 block">
            <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
              By when or how often
            </span>
            <input
              value={action.byWhen}
              onChange={(event) => updateAction(action.id, { byWhen: event.target.value })}
              className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink"
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...plan,
            actions: [
              ...plan.actions,
              { id: crypto.randomUUID(), action: "", who: "Both", byWhen: "" },
            ],
          })
        }
        className="tap mt-3 rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-ocean"
      >
        Add action
      </button>
      <label className="mt-3 block">
        <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Check back in on</span>
        <input
          type="date"
          value={plan.checkBackOn}
          onChange={(event) => onChange({ ...plan, checkBackOn: event.target.value })}
          className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink"
        />
      </label>
    </div>
  );
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
    <ol
      className={
        bare
          ? "overflow-hidden rounded-2xl bg-paper/80"
          : "overflow-hidden rounded-3xl border-2 border-line/15 bg-cream"
      }
    >
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
