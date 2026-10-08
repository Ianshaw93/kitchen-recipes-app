"use client";

import Link from "next/link";
import { ListeningChecklist } from "@/components/ListeningChecklist";
import { HorsemenReference } from "@/components/HorsemenReference";
import { EMPATHY_PROMPTS, GUIDE_LISTENING_KEY } from "@/lib/us-guide";

export function UsGuide() {
  return (
    <main className="mx-auto max-w-xl space-y-12 px-4 sm:px-6">
      <div>
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">Avery</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Guide</h1>
        <p className="mt-2 text-base leading-snug text-ink-soft">
          Read this while you journal in your notepad. Nothing you write is saved on the server.
        </p>
        <Link
          href="/us"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-extrabold uppercase tracking-wide text-brick underline-offset-4 hover:underline"
        >
          Back to Together
        </Link>
      </div>

      <ListeningChecklist storageKey={GUIDE_LISTENING_KEY} />

      <HorsemenReference framing="journal" />

      <section aria-labelledby="empathy-heading">
        <h2 id="empathy-heading" className="font-display text-2xl font-bold">
          Step outside your own head
        </h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          For when the horsemen do not cover it. Answer these in the notepad.
        </p>
        <ol className="mt-3 space-y-3">
          {EMPATHY_PROMPTS.map((prompt, index) => (
            <li key={prompt.id} className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-brick">Prompt {index + 1}</p>
              <p className="mt-1 text-lg font-semibold leading-snug">{prompt.prompt}</p>
            </li>
          ))}
        </ol>
      </section>

      {/*
        Future Ask DeepSeek panel: check Avery's understanding of a journal note
        against EMPATHY_PROMPTS and HORSEMEN. No API call in this prototype.
      */}
      <AskDeepSeekPlaceholder />
    </main>
  );
}

function AskDeepSeekPlaceholder() {
  return (
    <section
      aria-labelledby="ask-deepseek-heading"
      className="rounded-3xl border-2 border-dashed border-line/25 bg-paper px-5 py-5"
    >
      <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">Later</p>
      <h2 id="ask-deepseek-heading" className="mt-1 font-display text-2xl font-bold">
        Ask DeepSeek
      </h2>
      <p className="mt-2 text-base font-semibold leading-snug text-ink-soft">
        A check-your-understanding panel can slot in here. It is not wired up, and it will not save
        what you write.
      </p>
    </section>
  );
}
