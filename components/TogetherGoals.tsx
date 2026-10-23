"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  Card,
  ChoiceRow,
  EmptyState,
  Field,
  ItemActions,
  PrimaryButton,
  SectionHeading,
  TextArea,
  TextInput,
} from "@/components/UsUi";
import { useSharedRelationship } from "@/lib/relationship-context";
import {
  addGoal,
  addGoalAction,
  removeGoal,
  removeGoalAction,
  timelineLead,
  updateGoal,
  updateGoalAction,
  type ActionTimeline,
  type Goal,
  type GoalAction,
  type GoalActionDraft,
  type TimelineUnit,
  type Whose,
} from "@/lib/relationship";

const whoseOptions: Whose[] = ["Ian", "Avery", "Both"];

function segmentClass(selected: boolean): string {
  return `min-h-12 rounded-2xl border px-2 text-base font-bold transition-colors ${
    selected ? "border-brick/60 bg-brick/10 text-brick" : "border-line/15 bg-paper/30 text-ink-soft"
  }`;
}

function ActionForm({
  initial,
  defaultWho = "Both",
  submitLabel,
  onSubmit,
}: {
  initial?: GoalAction;
  defaultWho?: Whose;
  submitLabel: string;
  onSubmit: (draft: GoalActionDraft) => Promise<boolean>;
}) {
  const [who, setWho] = useState<Whose>(initial?.who ?? defaultWho);
  const [text, setText] = useState(initial?.text ?? "");
  const [kind, setKind] = useState<ActionTimeline["kind"]>(initial?.timeline.kind ?? "every");
  const [count, setCount] = useState(initial?.timeline.kind === "every" ? String(initial.timeline.count) : "2");
  const [unit, setUnit] = useState<TimelineUnit>(initial?.timeline.kind === "every" ? initial.timeline.unit : "days");
  const [says, setSays] = useState(initial?.timeline.kind === "when" ? initial.timeline.says : "");

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedCount = Number(count);
    const timeline: ActionTimeline | null =
      kind === "every"
        ? Number.isInteger(parsedCount) && parsedCount >= 1 && parsedCount <= 366
          ? { kind: "every", count: parsedCount, unit }
          : null
        : says.trim()
          ? { kind: "when", says: says.trim() }
          : null;
    if (!text.trim() || !timeline) {
      return;
    }
    void onSubmit({ who, text, timeline }).then((ok) => {
      if (!ok || initial) {
        return;
      }
      setText("");
      setSays("");
      setCount("2");
      setUnit("days");
      setKind("every");
      setWho(defaultWho);
    });
  }

  return (
    <form onSubmit={submit}>
      <ChoiceRow legend="Who" value={who} options={whoseOptions} nameFor={(option) => option} onChange={setWho} />
      <Field label="What I'll do">
        <TextInput
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask what you need, then wait"
          maxLength={240}
        />
      </Field>
      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-ink-soft">When</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={kind === "every"} onClick={() => setKind("every")} className={segmentClass(kind === "every")}>
            Every
          </button>
          <button
            type="button"
            aria-pressed={kind === "when"}
            onClick={() => setKind("when")}
            className={segmentClass(kind === "when")}
          >
            When they say
          </button>
        </div>
      </fieldset>
      {kind === "every" ? (
        <div className="mt-4">
          <span className="text-sm font-bold text-ink-soft">How often</span>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={366}
              aria-label="How often"
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="min-h-12 w-20 rounded-2xl border border-line/15 bg-paper/30 px-3 text-center text-base text-ink focus:border-brick/50 focus:outline-none focus:ring-4 focus:ring-brick/10"
            />
            <div className="grid flex-1 grid-cols-2 gap-2">
              {(["days", "weeks"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                  className={segmentClass(unit === option)}
                >
                  {option === "days" ? "Days" : "Weeks"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Field label="They say">
          <TextInput
            value={says}
            onChange={(event) => setSays(event.target.value)}
            placeholder="I'm overwhelmed"
            maxLength={160}
          />
        </Field>
      )}
      <PrimaryButton>{submitLabel}</PrimaryButton>
    </form>
  );
}

function AddDisclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-3xl border border-line/10 bg-cream/70">
      <summary className="tap flex cursor-pointer list-none items-center justify-between gap-3 px-4 text-base font-bold text-ocean [&::-webkit-details-marker]:hidden">
        {summary}
        <span aria-hidden="true" className="text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-line/10 px-4 pt-4 pb-4">{children}</div>
    </details>
  );
}

function GoalForm({ onAdd }: { onAdd: (title: string) => Promise<boolean> }) {
  const [title, setTitle] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) {
          return;
        }
        void onAdd(title).then((ok) => {
          if (ok) {
            setTitle("");
          }
        });
      }}
    >
      <Field label="Goal">
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Stay kind when we're tired"
          maxLength={160}
        />
      </Field>
      <PrimaryButton>Add goal</PrimaryButton>
    </form>
  );
}

function actionLabel(text: string): string {
  const trimmed = text.trim().replace(/\.+$/, "");
  if (!trimmed) {
    return text;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function GoalSlice({
  goal,
  actions,
  defaultWho,
  save,
}: {
  goal: Goal;
  actions: GoalAction[];
  defaultWho: Whose;
  save: ReturnType<typeof useSharedRelationship>["save"];
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [adding, setAdding] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [note, setNote] = useState(goal.note ?? "");
  const formOpen = editingActionId === null && (adding || actions.length === 0);

  return (
    <li aria-label={goal.title} className="border-t border-line/10 px-4 py-4 first:border-t-0">
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) {
              return;
            }
            void save((current) => updateGoal(current, goal.id, { title, note: goal.note })).then((ok) => {
              if (ok) {
                setEditing(false);
              }
            });
          }}
        >
          <Field label="Goal">
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />
          </Field>
          <PrimaryButton>Save</PrimaryButton>
        </form>
      ) : (
        <>
          <h4 className="font-display text-xl font-bold leading-tight">{goal.title}</h4>
          <ItemActions
            deleteLabel={`Delete ${goal.title}`}
            onEdit={() => {
              setTitle(goal.title);
              setEditing(true);
            }}
            onDelete={() => void save((current) => removeGoal(current, goal.id))}
          />
        </>
      )}
      {actions.length > 0 ? (
        <ul aria-label={`Actions for ${goal.title}`} className="mt-3 ml-1 border-l-2 border-ink-soft">
          {actions.map((action) =>
            editingActionId === action.id ? (
              <li key={action.id} className="py-3 pl-3">
                <ActionForm
                  initial={action}
                  submitLabel="Save"
                  onSubmit={async (draft) => {
                    const ok = await save((current) => updateGoalAction(current, goal.id, action.id, draft));
                    if (ok) {
                      setEditingActionId(null);
                    }
                    return ok;
                  }}
                />
              </li>
            ) : (
              <li key={action.id} className="py-3 pl-3">
                <p className="text-lg font-semibold leading-snug">{actionLabel(action.text)}</p>
                <p className="text-sm leading-snug text-ink-soft">{timelineLead(action.who, action.timeline)}</p>
                <ItemActions
                  deleteLabel={`Delete action ${action.text}`}
                  onEdit={() => {
                    setAdding(false);
                    setEditingActionId(action.id);
                  }}
                  onDelete={() => void save((current) => removeGoalAction(current, goal.id, action.id))}
                />
              </li>
            ),
          )}
        </ul>
      ) : null}
      {formOpen ? (
        <div className="mt-3">
          <ActionForm
            defaultWho={defaultWho}
            submitLabel="Add action"
            onSubmit={async (draft) => {
              const ok = await save((current) => addGoalAction(current, goal.id, draft));
              if (ok) {
                setAdding(false);
              }
              return ok;
            }}
          />
        </div>
      ) : editingActionId === null ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="tap -mx-3 mt-2 flex w-[calc(100%+1.5rem)] items-center justify-between px-3 text-left text-base font-bold text-ocean"
        >
          Add an action
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
        </button>
      ) : null}
      <div className="mt-3 border-t border-line/10 pt-3">
        {checkingIn ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save((current) => updateGoal(current, goal.id, { title: goal.title, note })).then((ok) => {
                if (ok) {
                  setCheckingIn(false);
                }
              });
            }}
          >
            <Field label="Is this helping?">
              <TextArea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="If it isn't, change the action."
              />
            </Field>
            <PrimaryButton>Save check-in</PrimaryButton>
          </form>
        ) : (
          <>
            {goal.note ? <p className="text-base leading-snug">{goal.note}</p> : null}
            <button
              type="button"
              onClick={() => {
                setNote(goal.note ?? "");
                setCheckingIn(true);
              }}
              className="tap -mx-3 rounded-full px-3 text-base font-bold text-ocean"
            >
              {goal.note ? "Update check-in" : "Check in"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function personHeading(who: Whose): string {
  return who === "Both" ? "Both" : who;
}

export function TogetherGoals() {
  const { document: notes, hydrated, save } = useSharedRelationship();
  const goals = notes?.goals ?? [];
  const grouped = whoseOptions
    .map((who) => ({
      who,
      slices: goals
        .map((goal) => ({
          goal,
          actions: goal.actions.filter((action) => action.who === who),
        }))
        .filter((slice) => slice.actions.length > 0),
    }))
    .filter((group) => group.slices.length > 0);
  const waiting = goals.filter((goal) => goal.actions.length === 0);

  return (
    <section aria-labelledby="goals-heading" className="space-y-5">
      <SectionHeading id="goals-heading" title="Goals">
        Split by person. Under Ian, Avery, or both of you, each goal lists its actions, and each action
        has its when. Check in on the goal, and change an action when it stops helping.
      </SectionHeading>
      {!notes || !hydrated ? (
        <EmptyState>Loading the shared notes…</EmptyState>
      ) : goals.length === 0 ? (
        <>
          <EmptyState>No goals yet.</EmptyState>
          <Card>
            <GoalForm onAdd={async (title) => save((current) => addGoal(current, { title }))} />
          </Card>
        </>
      ) : (
        <>
          {grouped.map((group) => (
            <section key={group.who} aria-labelledby={`goals-${group.who}`} className="rounded-3xl border border-line/10 bg-cream card-shadow">
              <h3 id={`goals-${group.who}`} className="px-4 pt-4 font-display text-2xl font-bold leading-tight">
                {personHeading(group.who)}
              </h3>
              <ul aria-label={group.who === "Both" ? "Goals for both" : `${group.who}'s goals`}>
                {group.slices.map((slice) => (
                  <GoalSlice
                    key={slice.goal.id}
                    goal={slice.goal}
                    actions={slice.actions}
                    defaultWho={group.who}
                    save={save}
                  />
                ))}
              </ul>
            </section>
          ))}
          {waiting.length > 0 ? (
            <ul aria-label="Goals" className="overflow-hidden rounded-3xl border border-line/10 bg-cream card-shadow">
              {waiting.map((goal) => (
                <GoalSlice key={goal.id} goal={goal} actions={[]} defaultWho="Both" save={save} />
              ))}
            </ul>
          ) : null}
          <AddDisclosure summary="Add a goal">
            <GoalForm onAdd={async (title) => save((current) => addGoal(current, { title }))} />
          </AddDisclosure>
        </>
      )}
    </section>
  );
}
