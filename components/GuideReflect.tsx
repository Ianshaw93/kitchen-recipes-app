import { SectionHeading } from "@/components/UsUi";
import { EMPATHY_PROMPTS } from "@/lib/us-guide";

export function GuideReflect() {
  return (
    <>
      <section aria-labelledby="empathy-heading" className="space-y-4">
        <SectionHeading id="empathy-heading" eyebrow="In your notepad" title="Step outside your own head">
          For when the horsemen do not cover it. Answer these in the notepad.
        </SectionHeading>
        <ol className="space-y-3">
          {EMPATHY_PROMPTS.map((prompt, index) => (
            <li
              key={prompt.id}
              className="flex gap-4 rounded-3xl border border-line/10 bg-cream px-4 py-4 card-shadow"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brick/10 font-display text-base font-bold text-brick"
              >
                {index + 1}
              </span>
              <p className="min-w-0 pt-0.5 text-lg font-semibold leading-snug">
                <span className="sr-only">Prompt {index + 1}: </span>
                {prompt.prompt}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/*
        Future Ask DeepSeek panel: check Avery's understanding of a journal note
        against EMPATHY_PROMPTS and HORSEMEN. No API call in this prototype.
      */}
      <AskDeepSeekPlaceholder />
    </>
  );
}

function AskDeepSeekPlaceholder() {
  return (
    <section
      aria-labelledby="ask-deepseek-heading"
      className="rounded-3xl border border-dashed border-line/25 bg-paper/60 px-5 py-5"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Later</p>
      <h2 id="ask-deepseek-heading" className="mt-1 font-display text-2xl font-bold leading-tight">
        Ask DeepSeek
      </h2>
      <p className="mt-2 text-base leading-relaxed text-ink-soft">
        A check-your-understanding panel can slot in here. It is not wired up, and it will not save
        what you write.
      </p>
    </section>
  );
}
