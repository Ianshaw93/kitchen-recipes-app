"use client";

import { ChoiceRow, Field, QuietButton, TextInput } from "@/components/UsUi";
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
  const total = listeningStepCount();
  const done = required.filter((step) => checked[step.id]).length;
  const planOpen = Boolean(checked["if-plan"] && plan && onPlanChange);

  return (
    <section aria-labelledby="listening-heading" className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brick">Speaker-Listener</p>
        <h2 id="listening-heading" className="mt-1 font-display text-[1.7rem] font-bold leading-tight tracking-tight">
          Active listening
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{SPEAKER_LISTENER_CREDIT}</p>
        <div className="mt-4 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Listening steps"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep/70"
          >
            <div
              className="h-full rounded-full bg-leaf transition-[width] duration-300"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <p className="shrink-0 text-sm font-bold text-ink-soft">
            Tap to tick · {done}/{total}
          </p>
          <QuietButton tone="brick" className="-mr-3" onClick={reset}>
            Reset
          </QuietButton>
        </div>
      </div>

      <div className="rounded-3xl border border-gold/30 bg-gold/[0.12] px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">For the speaker</p>
        <p className="mt-1.5 text-base font-semibold leading-snug">{SPEAKER_PROMPT}</p>
      </div>

      {LISTENING_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="text-sm font-bold text-brick">{group.title}</p>
          {group.note ? <p className="mt-0.5 text-base leading-snug text-ink-soft">{group.note}</p> : null}
          <div className="mt-2.5 space-y-2.5">
            <StepList steps={group.steps} checked={checked} onToggle={toggle} />
            {group.callouts?.map((callout) => (
              <div
                key={callout.tone}
                className={`rounded-3xl border px-3 py-3 ${
                  callout.tone === "do" ? "border-leaf/25 bg-leaf/[0.07]" : "border-brick/20 bg-brick/[0.06]"
                }`}
              >
                <p
                  className={`mb-2 px-1 text-xs font-bold uppercase tracking-wide ${
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
                      <li key={step.id} className="text-base leading-snug">
                        {step.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {notepadPlan && group.id === "if-relevant" ? (
            <p className="mt-3 rounded-2xl bg-paper-deep/40 px-4 py-3 text-base leading-snug text-ink-soft">
              {PLAN_NOTEPAD_PROMPT}
            </p>
          ) : null}
          {planOpen && plan && onPlanChange && group.id === "if-relevant" ? (
            <PlanEditor plan={plan} onChange={onPlanChange} />
          ) : null}
        </div>
      ))}
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
    <div className="mt-3 rounded-3xl border border-leaf/25 bg-cream px-4 py-4 card-shadow">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Plan for this session</p>
      <p className="mt-1 text-sm text-ink-soft">Saved with the takeaway below.</p>
      {plan.actions.map((action, index) => (
        <div key={action.id} className={`mt-4 ${index === 0 ? "" : "border-t border-line/10 pt-4"}`}>
          <Field label="Action">
            <TextInput
              value={action.action}
              onChange={(event) => updateAction(action.id, { action: event.target.value })}
            />
          </Field>
          <ChoiceRow
            legend="Who"
            value={action.who}
            options={PLAN_WHO}
            nameFor={(person) => `Plan ${person}`}
            onChange={(who) => updateAction(action.id, { who })}
          />
          <Field label="By when or how often">
            <TextInput
              value={action.byWhen}
              onChange={(event) => updateAction(action.id, { byWhen: event.target.value })}
            />
          </Field>
        </div>
      ))}
      <QuietButton
        className="-mx-3 mt-2"
        onClick={() =>
          onChange({
            ...plan,
            actions: [
              ...plan.actions,
              { id: crypto.randomUUID(), action: "", who: "Both", byWhen: "" },
            ],
          })
        }
      >
        + Add action
      </QuietButton>
      <div className="mt-2">
        <Field label="Check back in on">
          <TextInput
            type="date"
            value={plan.checkBackOn}
            onChange={(event) => onChange({ ...plan, checkBackOn: event.target.value })}
          />
        </Field>
      </div>
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
          ? "overflow-hidden rounded-2xl bg-cream/80"
          : "overflow-hidden rounded-3xl border border-line/10 bg-cream card-shadow"
      }
    >
      {steps.map((step, index) => {
        const isOn = Boolean(checked[step.id]);
        return (
          <li key={step.id} className={index === 0 ? "" : "border-t border-line/10"}>
            <button
              type="button"
              onClick={() => onToggle(step.id)}
              aria-pressed={isOn}
              className="tap flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <TickBox on={isOn} />
              <span
                className={`min-w-0 pt-1 text-base leading-snug ${
                  isOn ? "text-ink-soft line-through decoration-ink-soft/40" : "text-ink"
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
