import type { ReactNode } from "react";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { formatISODate } from "@/lib/relationship";

const KIND_STYLE = {
  win: { label: "Win", item: "bg-leaf/[0.1] border-leaf/25", chip: "bg-leaf text-cream" },
  slip: { label: "Slip", item: "bg-brick/[0.08] border-brick/20", chip: "bg-brick text-cream" },
} as const;

const SOFT_CHIP = "rounded-full px-2 py-0.5 text-[0.7rem] font-bold";

function whoLabel(who: BehaviourTag["who"]): string | null {
  return who ? who.charAt(0).toUpperCase() + who.slice(1) : null;
}

export function BehaviourTagItem({
  tag,
  isNew = false,
  pattern,
  actions,
}: {
  tag: BehaviourTag;
  isNew?: boolean;
  pattern?: string | null;
  actions?: ReactNode;
}) {
  const style = KIND_STYLE[tag.kind];
  const meta = [whoLabel(tag.who), tag.date ? formatISODate(tag.date) : null].filter(Boolean).join(" · ");
  return (
    <li className={`rounded-2xl border px-3 py-2.5 ${style.item}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide ${style.chip}`}>
          {style.label}
        </span>
        {pattern ? (
          <span className={`${SOFT_CHIP} ${tag.kind === "win" ? "bg-leaf/15 text-leaf" : "bg-brick/10 text-brick"}`}>
            {pattern}
          </span>
        ) : null}
        {tag.label ? <span className={`${SOFT_CHIP} bg-ink/[0.06] text-ink-soft`}>{tag.label}</span> : null}
        {isNew ? (
          <span className="rounded-full border border-gold/60 bg-gold/20 px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ink">
            New
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-base leading-snug">{tag.text}</p>
      {meta ? <p className="mt-1 text-xs font-semibold text-ink-soft">{meta}</p> : null}
      {actions}
    </li>
  );
}
