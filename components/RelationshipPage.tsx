"use client";

import { type ComponentProps, type FormEvent, type ReactNode, useState } from "react";
import {
  FOUR_HORSEMEN,
  NON_NEGOTIABLE_CATEGORY_PROMPTS,
  STATE_OF_THE_UNION_STEPS,
  addBehaviourExample,
  addMustHave,
  addPersonalItem,
  addTakeaway,
  addWillNot,
  addWorkOn,
  formatISODate,
  removeBehaviourExample,
  removeMustHave,
  removePersonalItem,
  removeTakeaway,
  removeWillNot,
  removeWorkOn,
  setToxicDocUrl,
  todayISODate,
  updateBehaviourExample,
  updateMustHave,
  updatePersonalItem,
  updateWillNot,
  updateWorkOn,
  type BehaviourExample,
  type BehaviourPerson,
  type Person,
  type PersonalItem,
  type RelationshipDocument,
  type Takeaway,
  type Whose,
  type WillNot,
  type WorkOnItem,
  type WorkStatus,
} from "@/lib/relationship";
import { useRelationship } from "@/lib/use-relationship";
import { ListeningChecklist } from "./ListeningChecklist";

const people: Person[] = ["Ian", "Avery"];
const whoseOptions: Whose[] = ["Ian", "Avery", "Both"];
const statuses: WorkStatus[] = ["open", "practising", "parked"];

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
      {children}
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={`tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink ${props.className ?? ""}`}
    />
  );
}

function ChoiceRow<T extends string>({
  legend,
  value,
  options,
  nameFor,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  nameFor: (option: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">{legend}</legend>
      <div className={`mt-2 grid gap-2 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              aria-label={nameFor(option)}
              onClick={() => onChange(option)}
              className={`tap rounded-2xl border-2 text-sm font-extrabold ${
                selected ? "border-brick bg-brick text-cream" : "border-line/20 bg-cream text-ink"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ItemActions({
  onEdit,
  onDelete,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="tap rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-ocean"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        className="tap rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-brick"
      >
        Delete
      </button>
    </div>
  );
}

function MustHaveList({
  document,
  save,
}: {
  document: RelationshipDocument;
  save: (mutate: (current: RelationshipDocument) => RelationshipDocument) => Promise<boolean>;
}) {
  const items = document.nonNegotiables.mustHaves;
  const [weNeed, setWeNeed] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNeed, setEditNeed] = useState("");
  const [editWhy, setEditWhy] = useState("");

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    if (!weNeed.trim() || !whyItMatters.trim()) {
      return;
    }
    const saved = await save((current) => addMustHave(current, { weNeed, whyItMatters }));
    if (saved) {
      setWeNeed("");
      setWhyItMatters("");
    }
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Shared must-haves</h3>
      <p className="text-sm font-semibold text-ink-soft">We need… / Why it matters</p>
      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState>
            Nothing here yet. Add a shared must-have. Categories to consider:{" "}
            {NON_NEGOTIABLE_CATEGORY_PROMPTS.join("; ")}.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
          {items.map((item, index) => (
            <li key={item.id} className={`px-4 py-4 ${index === 0 ? "" : "border-t-2 border-line/10"}`}>
              {editingId === item.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save((current) =>
                      updateMustHave(current, item.id, { weNeed: editNeed, whyItMatters: editWhy }),
                    ).then((ok) => {
                      if (ok) {
                        setEditingId(null);
                      }
                    });
                  }}
                >
                  <TextInput value={editNeed} onChange={(event) => setEditNeed(event.target.value)} />
                  <TextInput value={editWhy} onChange={(event) => setEditWhy(event.target.value)} />
                  <button type="submit" className="tap mt-2 rounded-2xl bg-ink px-4 text-sm font-extrabold text-cream">
                    Save
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-lg font-semibold">{item.weNeed}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">{item.whyItMatters}</p>
                  <ItemActions
                    deleteLabel={`Delete must-have ${item.weNeed}`}
                    onEdit={() => {
                      setEditingId(item.id);
                      setEditNeed(item.weNeed);
                      setEditWhy(item.whyItMatters);
                    }}
                    onDelete={() => void save((current) => removeMustHave(current, item.id))}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(event) => void onAdd(event)} className="mt-3">
        <Field label="We need…">
          <TextInput value={weNeed} onChange={(event) => setWeNeed(event.target.value)} placeholder="We need…" />
        </Field>
        <Field label="Why it matters">
          <TextInput
            value={whyItMatters}
            onChange={(event) => setWhyItMatters(event.target.value)}
            placeholder="Why it matters"
          />
        </Field>
        <button type="submit" className="tap mt-3 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream">
          Add must-have
        </button>
      </form>
    </div>
  );
}

function SimpleList({
  title,
  empty,
  items,
  onAdd,
  onEdit,
  onDelete,
  addLabel,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; text: string }>;
  onAdd: (text: string) => Promise<boolean>;
  onEdit: (id: string, text: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    const saved = await onAdd(draft);
    if (saved) {
      setDraft("");
    }
  }

  return (
    <div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState>{empty}</EmptyState>
        </div>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
          {items.map((item, index) => (
            <li key={item.id} className={`px-4 py-4 ${index === 0 ? "" : "border-t-2 border-line/10"}`}>
              {editingId === item.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onEdit(item.id, editText).then((ok) => {
                      if (ok) {
                        setEditingId(null);
                      }
                    });
                  }}
                >
                  <TextInput value={editText} onChange={(event) => setEditText(event.target.value)} />
                  <button type="submit" className="tap mt-2 rounded-2xl bg-ink px-4 text-sm font-extrabold text-cream">
                    Save
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-lg font-semibold leading-snug">{item.text}</p>
                  <ItemActions
                    deleteLabel={`Delete ${item.text}`}
                    onEdit={() => {
                      setEditingId(item.id);
                      setEditText(item.text);
                    }}
                    onDelete={() => onDelete(item.id)}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(event) => void submit(event)} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor={`add-${addLabel}`}>
          {addLabel}
        </label>
        <input
          id={`add-${addLabel}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an item"
          className="tap min-w-0 flex-1 rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink"
        />
        <button
          type="submit"
          className="tap shrink-0 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function BehaviourCard({
  item,
  onEdit,
  onDelete,
}: {
  item: BehaviourExample;
  onEdit: (draft: { text: string; date?: string; tag?: string }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [date, setDate] = useState(item.date ?? "");
  const [tag, setTag] = useState(item.tag ?? "");

  return (
    <li className="border-t-2 border-line/10 px-4 py-4 first:border-t-0">
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onEdit({ text, date: date || undefined, tag: tag || undefined }).then((ok) => {
              if (ok) {
                setEditing(false);
              }
            });
          }}
        >
          <TextInput value={text} onChange={(event) => setText(event.target.value)} />
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <TextInput value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Tag" />
          <button type="submit" className="tap mt-2 rounded-2xl bg-ink px-4 text-sm font-extrabold text-cream">
            Save
          </button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {item.date ? (
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                {formatISODate(item.date)}
              </p>
            ) : null}
            {item.tag ? (
              <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-leaf">
                {item.tag}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-lg font-semibold leading-snug">{item.text}</p>
          <ItemActions
            deleteLabel={`Delete example ${item.text}`}
            onEdit={() => setEditing(true)}
            onDelete={onDelete}
          />
        </>
      )}
    </li>
  );
}

function WorkOnCard({
  item,
  onEdit,
  onDelete,
}: {
  item: WorkOnItem;
  onEdit: (draft: {
    whose: Whose;
    theme: string;
    observableTry: string;
    lastTalked?: string;
    status: WorkStatus;
  }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [whose, setWhose] = useState(item.whose);
  const [theme, setTheme] = useState(item.theme);
  const [observableTry, setObservableTry] = useState(item.observableTry);
  const [lastTalked, setLastTalked] = useState(item.lastTalked ?? "");
  const [status, setStatus] = useState(item.status);

  return (
    <li className="border-t-2 border-line/10 px-4 py-4 first:border-t-0">
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onEdit({
              whose,
              theme,
              observableTry,
              lastTalked: lastTalked || undefined,
              status,
            }).then((ok) => {
              if (ok) {
                setEditing(false);
              }
            });
          }}
        >
          <ChoiceRow legend="Whose" value={whose} options={whoseOptions} nameFor={(option) => option} onChange={setWhose} />
          <Field label="Theme">
            <TextInput value={theme} onChange={(event) => setTheme(event.target.value)} />
          </Field>
          <Field label="Observable try">
            <TextInput value={observableTry} onChange={(event) => setObservableTry(event.target.value)} />
          </Field>
          <Field label="Last talked">
            <TextInput type="date" value={lastTalked} onChange={(event) => setLastTalked(event.target.value)} />
          </Field>
          <ChoiceRow legend="Status" value={status} options={statuses} nameFor={(option) => option} onChange={setStatus} />
          <button type="submit" className="tap mt-3 rounded-2xl bg-ink px-4 text-sm font-extrabold text-cream">
            Save
          </button>
        </form>
      ) : (
        <>
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            {item.whose} · {item.status}
            {item.lastTalked ? ` · ${formatISODate(item.lastTalked)}` : ""}
          </p>
          <p className="mt-1 text-lg font-semibold leading-snug">{item.theme}</p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">{item.observableTry}</p>
          <ItemActions deleteLabel={`Delete ${item.theme}`} onEdit={() => setEditing(true)} onDelete={onDelete} />
        </>
      )}
    </li>
  );
}

export function RelationshipPage() {
  const { document, hydrated, syncError, save } = useRelationship();
  const [person, setPerson] = useState<BehaviourPerson>("avery");
  const [behaviourText, setBehaviourText] = useState("");
  const [behaviourDate, setBehaviourDate] = useState("");
  const [behaviourTag, setBehaviourTag] = useState("");
  const [toxicDraft, setToxicDraft] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState<Person>("Ian");
  const [heard, setHeard] = useState("");
  const [theyNeed, setTheyNeed] = useState("");
  const [illDo, setIllDo] = useState("");
  const [iNeed, setINeed] = useState("");
  const [workWhose, setWorkWhose] = useState<Whose>("Both");
  const [workTheme, setWorkTheme] = useState("");
  const [workTry, setWorkTry] = useState("");
  const [workTalked, setWorkTalked] = useState("");
  const [workStatus, setWorkStatus] = useState<WorkStatus>("open");

  const notes = document;
  const toxicUrl = toxicDraft ?? notes?.toxicDocUrl ?? "";

  async function addBehaviour(event: FormEvent) {
    event.preventDefault();
    if (!behaviourText.trim()) {
      return;
    }
    const saved = await save((current) =>
      addBehaviourExample(current, person, {
        text: behaviourText,
        date: behaviourDate || undefined,
        tag: behaviourTag || undefined,
      }),
    );
    if (saved) {
      setBehaviourText("");
      setBehaviourDate("");
      setBehaviourTag("");
    }
  }

  async function saveToxic(event: FormEvent) {
    event.preventDefault();
    await save((current) => setToxicDocUrl(current, toxicUrl));
  }

  async function saveTakeaway(event: FormEvent) {
    event.preventDefault();
    if (!heard.trim() || !theyNeed.trim() || !illDo.trim()) {
      return;
    }
    const saved = await save((current) =>
      addTakeaway(current, {
        date: todayISODate(),
        speaker,
        whatIHeard: heard,
        whatTheyNeed: theyNeed,
        oneThingIllDo: illDo,
        whatINeed: iNeed,
      }),
    );
    if (saved) {
      setHeard("");
      setTheyNeed("");
      setIllDo("");
      setINeed("");
    }
  }

  async function addWork(event: FormEvent) {
    event.preventDefault();
    if (!workTheme.trim() || !workTry.trim()) {
      return;
    }
    const saved = await save((current) =>
      addWorkOn(current, {
        whose: workWhose,
        theme: workTheme,
        observableTry: workTry,
        lastTalked: workTalked || undefined,
        status: workStatus,
      }),
    );
    if (saved) {
      setWorkTheme("");
      setWorkTry("");
      setWorkTalked("");
      setWorkStatus("open");
    }
  }

  const examples = notes?.behaviourExamples[person] ?? [];

  return (
    <main className="mx-auto max-w-xl space-y-12 px-4 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Us</h1>
        <p className="mt-2 text-base leading-snug text-ink-soft">
          Notes for building the relationship. Unlinked from the rest of Kusina on purpose.
        </p>
      </div>

      {syncError ? (
        <p className="rounded-3xl border-2 border-brick/30 bg-brick/10 px-5 py-3 text-base font-bold" role="alert">
          {syncError}
        </p>
      ) : null}

      <section aria-labelledby="non-negotiables-heading">
        <h2 id="non-negotiables-heading" className="font-display text-2xl font-bold">
          Non-negotiables
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Shared must-haves and will-nots, plus optional personal lists.
        </p>
        {!hydrated || !notes ? (
          <div className="mt-3">
            <EmptyState>Loading shared notes…</EmptyState>
          </div>
        ) : (
          <div className="mt-5 space-y-8">
            <MustHaveList document={notes} save={save} />
            <SimpleList
              title="Shared will-nots"
              empty="Nothing here yet. Add a deal-breaker: we will not accept…"
              items={notes.nonNegotiables.willNots.map((item: WillNot) => ({
                id: item.id,
                text: item.weWillNotAccept,
              }))}
              addLabel="will-not"
              onAdd={(text) => save((current) => addWillNot(current, text))}
              onEdit={(id, text) => save((current) => updateWillNot(current, id, text))}
              onDelete={(id) => void save((current) => removeWillNot(current, id))}
            />
            <SimpleList
              title="Ian's personal"
              empty="Optional. Add what matters to Ian where you differ."
              items={notes.nonNegotiables.ianPersonal.map((item: PersonalItem) => item)}
              addLabel="ian-personal"
              onAdd={(text) => save((current) => addPersonalItem(current, "ianPersonal", text))}
              onEdit={(id, text) => save((current) => updatePersonalItem(current, "ianPersonal", id, text))}
              onDelete={(id) => void save((current) => removePersonalItem(current, "ianPersonal", id))}
            />
            <SimpleList
              title="Avery's personal"
              empty="Optional. Add what matters to Avery where you differ."
              items={notes.nonNegotiables.averyPersonal.map((item: PersonalItem) => item)}
              addLabel="avery-personal"
              onAdd={(text) => save((current) => addPersonalItem(current, "averyPersonal", text))}
              onEdit={(id, text) => save((current) => updatePersonalItem(current, "averyPersonal", id, text))}
              onDelete={(id) => void save((current) => removePersonalItem(current, "averyPersonal", id))}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="behaviour-heading">
        <h2 id="behaviour-heading" className="font-display text-2xl font-bold">
          Behaviour examples
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Avery&apos;s positives first. Short text, optional date and tag.
        </p>
        <div role="tablist" className="mt-4 grid grid-cols-2 gap-3">
          {(["avery", "ian"] as const).map((who) => {
            const selected = person === who;
            const label = who === "avery" ? "Avery examples" : "Ian examples";
            return (
              <button
                key={who}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPerson(who)}
                className={`tap rounded-2xl border-2 text-lg font-extrabold ${
                  selected ? "border-brick bg-brick text-cream" : "border-line/20 bg-cream text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!hydrated || !notes ? (
          <div className="mt-3">
            <EmptyState>Loading examples…</EmptyState>
          </div>
        ) : examples.length === 0 ? (
          <div className="mt-3">
            <EmptyState>No examples yet. Add one below.</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
            {examples.map((item) => (
              <BehaviourCard
                key={item.id}
                item={item}
                onEdit={(draft) => save((current) => updateBehaviourExample(current, person, item.id, draft))}
                onDelete={() => void save((current) => removeBehaviourExample(current, person, item.id))}
              />
            ))}
          </ul>
        )}
        <form onSubmit={(event) => void addBehaviour(event)} className="mt-4">
          <Field label="Example">
            <TextInput
              value={behaviourText}
              onChange={(event) => setBehaviourText(event.target.value)}
              placeholder="What happened"
            />
          </Field>
          <Field label="Date (optional)">
            <TextInput type="date" value={behaviourDate} onChange={(event) => setBehaviourDate(event.target.value)} />
          </Field>
          <Field label="Tag (optional)">
            <TextInput
              value={behaviourTag}
              onChange={(event) => setBehaviourTag(event.target.value)}
              placeholder="kindness, gratitude, support, repair"
            />
          </Field>
          <button
            type="submit"
            className="tap mt-3 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
          >
            Add example
          </button>
        </form>
      </section>

      <section aria-labelledby="toxic-heading">
        <h2 id="toxic-heading" className="font-display text-2xl font-bold">
          Toxic behaviours Doc
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Link slot for the Google Doc. Leave the placeholder until you have a URL.
        </p>
        {notes?.toxicDocUrl ? (
          <a
            href={notes.toxicDocUrl}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-line/20 bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-brick"
          >
            Open the Doc
          </a>
        ) : (
          <div className="mt-3">
            <EmptyState>Add the Google Doc link when you have it.</EmptyState>
          </div>
        )}
        <form onSubmit={(event) => void saveToxic(event)} className="mt-3">
          <Field label="Google Doc URL">
            <TextInput
              type="url"
              value={toxicUrl}
              onChange={(event) => setToxicDraft(event.target.value)}
              placeholder="https://"
            />
          </Field>
          <button
            type="submit"
            className="tap mt-3 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
          >
            Save link
          </button>
        </form>
      </section>

      <ListeningChecklist />

      <section aria-labelledby="takeaways-heading">
        <h2 id="takeaways-heading" className="font-display text-2xl font-bold">
          Session takeaways
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Fill this after both of you have had the floor. Saved to the shared notes.
        </p>
        <form onSubmit={(event) => void saveTakeaway(event)} className="mt-4">
          <ChoiceRow
            legend="Who was speaker"
            value={speaker}
            options={people}
            nameFor={(option) => `Speaker ${option}`}
            onChange={setSpeaker}
          />
          <Field label="What I heard">
            <TextInput value={heard} onChange={(event) => setHeard(event.target.value)} />
          </Field>
          <Field label="What they need">
            <TextInput value={theyNeed} onChange={(event) => setTheyNeed(event.target.value)} />
          </Field>
          <Field label="One thing I'll do">
            <TextInput value={illDo} onChange={(event) => setIllDo(event.target.value)} />
          </Field>
          <Field label="What I need (optional)">
            <TextInput value={iNeed} onChange={(event) => setINeed(event.target.value)} />
          </Field>
          <button
            type="submit"
            className="tap mt-4 w-full rounded-2xl bg-brick text-xl font-extrabold text-cream"
          >
            Save takeaway
          </button>
        </form>
        <div className="mt-6">
          <h3 className="font-display text-xl font-bold">Takeaways history</h3>
          {!hydrated || !notes ? (
            <div className="mt-3">
              <EmptyState>Loading takeaways…</EmptyState>
            </div>
          ) : notes.takeaways.length === 0 ? (
            <div className="mt-3">
              <EmptyState>No sessions saved yet. Tick the steps, then capture what you heard.</EmptyState>
            </div>
          ) : (
            <ol className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
              {notes.takeaways.map((item: Takeaway, index) => (
                <li key={item.id} className={`px-4 py-4 ${index === 0 ? "" : "border-t-2 border-line/10"}`}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                    {formatISODate(item.date)} · Speaker {item.speaker}
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-snug">{item.whatIHeard}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">They need: {item.whatTheyNeed}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">I&apos;ll do: {item.oneThingIllDo}</p>
                  {item.whatINeed ? (
                    <p className="mt-1 text-sm font-semibold text-ink-soft">I need: {item.whatINeed}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void save((current) => removeTakeaway(current, item.id))}
                    className="tap mt-2 rounded-2xl px-3 text-sm font-extrabold uppercase tracking-wide text-brick"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-labelledby="work-on-heading">
        <h2 id="work-on-heading" className="font-display text-2xl font-bold">
          Things to work on
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Whose, theme, an observable try, last talked, and status.
        </p>
        {!hydrated || !notes ? (
          <div className="mt-3">
            <EmptyState>Loading…</EmptyState>
          </div>
        ) : notes.thingsToWorkOn.length === 0 ? (
          <div className="mt-3">
            <EmptyState>Add something to practise. Keep it observable.</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
            {notes.thingsToWorkOn.map((item) => (
              <WorkOnCard
                key={item.id}
                item={item}
                onEdit={(draft) => save((current) => updateWorkOn(current, item.id, draft))}
                onDelete={() => void save((current) => removeWorkOn(current, item.id))}
              />
            ))}
          </ul>
        )}
        <form onSubmit={(event) => void addWork(event)} className="mt-4">
          <ChoiceRow
            legend="Whose"
            value={workWhose}
            options={whoseOptions}
            nameFor={(option) => `Whose ${option}`}
            onChange={setWorkWhose}
          />
          <Field label="Theme">
            <TextInput value={workTheme} onChange={(event) => setWorkTheme(event.target.value)} />
          </Field>
          <Field label="Observable try">
            <TextInput value={workTry} onChange={(event) => setWorkTry(event.target.value)} />
          </Field>
          <Field label="Last talked (optional)">
            <TextInput type="date" value={workTalked} onChange={(event) => setWorkTalked(event.target.value)} />
          </Field>
          <ChoiceRow
            legend="Status"
            value={workStatus}
            options={statuses}
            nameFor={(option) => option}
            onChange={setWorkStatus}
          />
          <button
            type="submit"
            className="tap mt-3 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
          >
            Add item
          </button>
        </form>
      </section>

      <section
        aria-labelledby="sotu-heading"
        className="rounded-3xl border-2 border-gold/40 bg-gold/15 px-5 py-5 card-shadow"
      >
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">Weekly prompt</p>
        <h2 id="sotu-heading" className="mt-1 font-display text-2xl font-bold">
          State of the Union
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base font-semibold leading-snug">
          {STATE_OF_THE_UNION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="horsemen-heading"
        className="rounded-3xl border-2 border-line/15 bg-cream px-5 py-5 card-shadow"
      >
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">Reference</p>
        <h2 id="horsemen-heading" className="mt-1 font-display text-2xl font-bold">
          Four Horsemen → antidotes
        </h2>
        <ul className="mt-3 space-y-3">
          {FOUR_HORSEMEN.map((row) => (
            <li key={row.horseman}>
              <p className="text-xs font-extrabold uppercase tracking-wide text-brick">{row.horseman}</p>
              <p className="text-base font-semibold leading-snug">{row.antidote}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
