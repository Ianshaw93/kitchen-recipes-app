"use client";

import { type FormEvent, useState } from "react";
import {
  AddDisclosure,
  Card,
  ChoiceRow,
  EmptyState,
  Field,
  ItemActions,
  Meta,
  PrimaryButton,
  SectionHeading,
  TextInput,
} from "@/components/UsUi";
import { TogetherMoments } from "@/components/TogetherMoments";
import { useSharedRelationship } from "@/lib/relationship-context";
import {
  addWorkOn,
  formatISODate,
  removeWorkOn,
  setToxicDocUrl,
  updateWorkOn,
  type Whose,
  type WorkOnItem,
  type WorkStatus,
} from "@/lib/relationship";

const whoseOptions: Whose[] = ["Ian", "Avery", "Both"];
const statuses: WorkStatus[] = ["open", "practising", "parked"];

function SaveButton({ children = "Save" }: { children?: string }) {
  return (
    <button type="submit" className="tap mt-4 rounded-2xl bg-ink px-5 text-base font-bold text-cream">
      {children}
    </button>
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
    <li className="border-t border-line/10 px-4 py-4 first:border-t-0">
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
          <SaveButton />
        </form>
      ) : (
        <>
          <Meta>
            {item.whose} · {item.status}
            {item.lastTalked ? ` · ${formatISODate(item.lastTalked)}` : ""}
          </Meta>
          <p className="mt-1 text-lg font-semibold leading-snug">{item.theme}</p>
          <p className="mt-1 text-base leading-snug text-ink-soft">{item.observableTry}</p>
          <ItemActions deleteLabel={`Delete ${item.theme}`} onEdit={() => setEditing(true)} onDelete={onDelete} />
        </>
      )}
    </li>
  );
}

export function TogetherNotes() {
  const { document: notes, hydrated, save } = useSharedRelationship();
  const [toxicDraft, setToxicDraft] = useState<string | null>(null);
  const [workWhose, setWorkWhose] = useState<Whose>("Both");
  const [workTheme, setWorkTheme] = useState("");
  const [workTry, setWorkTry] = useState("");
  const [workTalked, setWorkTalked] = useState("");
  const [workStatus, setWorkStatus] = useState<WorkStatus>("open");

  const toxicUrl = toxicDraft ?? notes?.toxicDocUrl ?? "";

  async function saveToxic(event: FormEvent) {
    event.preventDefault();
    await save((current) => setToxicDocUrl(current, toxicUrl));
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

  return (
    <>
      <TogetherMoments />

      <section aria-labelledby="work-on-heading" className="space-y-4">
        <SectionHeading id="work-on-heading" eyebrow="Practising" title="Things to work on">
          Whose, theme, an observable try, last talked, and status.
        </SectionHeading>
        {!hydrated || !notes ? (
          <EmptyState>Loading…</EmptyState>
        ) : notes.thingsToWorkOn.length === 0 ? (
          <EmptyState>Add something to practise. Keep it observable.</EmptyState>
        ) : (
          <ul className="overflow-hidden rounded-3xl border border-line/10 bg-cream card-shadow">
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
        <AddDisclosure summary="Add something to work on">
          <form onSubmit={(event) => void addWork(event)}>
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
            <PrimaryButton>Add item</PrimaryButton>
          </form>
        </AddDisclosure>
      </section>

      <section aria-labelledby="toxic-heading" className="space-y-4">
        <SectionHeading id="toxic-heading" eyebrow="Link" title="Toxic behaviours Doc">
          Link slot for the Google Doc. Leave the placeholder until you have a URL.
        </SectionHeading>
        {notes?.toxicDocUrl ? (
          <a
            href={notes.toxicDocUrl}
            className="inline-flex min-h-12 items-center rounded-full border border-line/15 bg-cream px-5 text-base font-bold text-brick card-shadow"
          >
            Open the Doc
          </a>
        ) : (
          <EmptyState>Add the Google Doc link when you have it.</EmptyState>
        )}
        <Card>
          <form onSubmit={(event) => void saveToxic(event)}>
            <Field label="Google Doc URL">
              <TextInput
                type="url"
                value={toxicUrl}
                onChange={(event) => setToxicDraft(event.target.value)}
                placeholder="https://"
              />
            </Field>
            <SaveButton>Save link</SaveButton>
          </form>
        </Card>
      </section>
    </>
  );
}
