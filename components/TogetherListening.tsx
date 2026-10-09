"use client";

import { type FormEvent, useState } from "react";
import { ListeningChecklist } from "@/components/ListeningChecklist";
import {
  Card,
  ChoiceRow,
  EmptyState,
  Field,
  Meta,
  PrimaryButton,
  QuietButton,
  SectionHeading,
  SubHeading,
  TextArea,
  TextInput,
} from "@/components/UsUi";
import { useSharedRelationship } from "@/lib/relationship-context";
import {
  LISTENING_CHECKLIST_KEY,
  addCheckInStandard,
  addTakeaway,
  emptySessionPlan,
  formatISODate,
  removeTakeaway,
  sessionPlanFromDraft,
  todayISODate,
  type Person,
  type Takeaway,
} from "@/lib/relationship";
import { useCheckedItems } from "@/lib/use-checked-items";

const people: Person[] = ["Ian", "Avery"];

export function TogetherListening() {
  const { document: notes, hydrated, save } = useSharedRelationship();
  const [speaker, setSpeaker] = useState<Person>("Ian");
  const [heard, setHeard] = useState("");
  const [theyNeed, setTheyNeed] = useState("");
  const [illDo, setIllDo] = useState("");
  const [iNeed, setINeed] = useState("");
  const [plan, setPlan] = useState(emptySessionPlan);
  const listeningTicks = useCheckedItems(LISTENING_CHECKLIST_KEY);

  async function saveTakeaway(event: FormEvent) {
    event.preventDefault();
    if (!heard.trim() || !theyNeed.trim() || !illDo.trim()) {
      return;
    }
    const sessionPlan = listeningTicks.checked["if-plan"] ? sessionPlanFromDraft(plan) : undefined;
    const saved = await save((current) =>
      addTakeaway(current, {
        date: todayISODate(),
        speaker,
        whatIHeard: heard,
        whatTheyNeed: theyNeed,
        oneThingIllDo: illDo,
        whatINeed: iNeed,
        plan: sessionPlan,
      }),
    );
    if (saved) {
      setHeard("");
      setTheyNeed("");
      setIllDo("");
      setINeed("");
      setPlan(emptySessionPlan());
    }
  }

  const onCheckIn = new Set(notes?.checkInStandards.map((item) => item.text) ?? []);

  return (
    <>
      <ListeningChecklist plan={plan} onPlanChange={setPlan} />

      <section aria-labelledby="takeaways-heading" className="space-y-5">
        <SectionHeading id="takeaways-heading" eyebrow="After you've both spoken" title="Session takeaways">
          Capture what landed. Saved to the shared notes.
        </SectionHeading>
        <Card>
          <form onSubmit={(event) => void saveTakeaway(event)}>
            <ChoiceRow
              legend="Who was speaker"
              value={speaker}
              options={people}
              nameFor={(option) => `Speaker ${option}`}
              onChange={setSpeaker}
            />
            <Field label="What I heard">
              <TextArea value={heard} onChange={(event) => setHeard(event.target.value)} />
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
            <PrimaryButton>Save takeaway</PrimaryButton>
          </form>
        </Card>

        <div className="space-y-3 pt-2">
          <SubHeading>Takeaways history</SubHeading>
          {!hydrated || !notes ? (
            <EmptyState>Loading takeaways…</EmptyState>
          ) : notes.takeaways.length === 0 ? (
            <EmptyState>No sessions saved yet. Tick the steps, then capture what you heard.</EmptyState>
          ) : (
            <ol className="space-y-3">
              {notes.takeaways.map((item: Takeaway) => (
                <li key={item.id}>
                  <Card>
                    <Meta>
                      {formatISODate(item.date)} · Speaker {item.speaker}
                    </Meta>
                    <p className="mt-1.5 text-lg font-semibold leading-snug">{item.whatIHeard}</p>
                    <dl className="mt-2 space-y-1 text-base leading-snug text-ink-soft">
                      <div>
                        <dt className="inline font-bold">They need: </dt>
                        <dd className="inline">{item.whatTheyNeed}</dd>
                      </div>
                      <div>
                        <dt className="inline font-bold">I&apos;ll do: </dt>
                        <dd className="inline">{item.oneThingIllDo}</dd>
                      </div>
                      {item.whatINeed ? (
                        <div>
                          <dt className="inline font-bold">I need: </dt>
                          <dd className="inline">{item.whatINeed}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {item.plan && (item.plan.actions.length > 0 || item.plan.checkBackOn) ? (
                      <div className="mt-3 rounded-2xl bg-leaf/[0.07] px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-leaf">Plan</p>
                        {item.plan.actions.map((action) => {
                          const added = onCheckIn.has(action.action.trim());
                          return (
                            <div key={action.id} className="mt-2">
                              <p className="text-base font-semibold leading-snug">{action.action}</p>
                              <p className="text-sm text-ink-soft">
                                {action.who}
                                {action.byWhen ? ` · ${action.byWhen}` : ""}
                              </p>
                              <QuietButton
                                className="-mx-3"
                                disabled={added}
                                onClick={() => void save((current) => addCheckInStandard(current, action.action))}
                              >
                                {added ? "✓ On the check-in list" : "Add as standard to check-in list"}
                              </QuietButton>
                            </div>
                          );
                        })}
                        {item.plan.checkBackOn ? (
                          <p className="mt-2 text-sm font-semibold text-ink-soft">
                            Check back in on {formatISODate(item.plan.checkBackOn)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <QuietButton
                      tone="brick"
                      className="-mx-3 mt-1"
                      onClick={() => void save((current) => removeTakeaway(current, item.id))}
                    >
                      Delete
                    </QuietButton>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
