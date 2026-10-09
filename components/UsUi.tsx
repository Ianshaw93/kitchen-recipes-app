import type { ComponentProps, ReactNode } from "react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brick">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="mt-1 font-display text-[1.7rem] font-bold leading-tight tracking-tight">
        {title}
      </h2>
      {children ? <div className="mt-2 text-base leading-relaxed text-ink-soft">{children}</div> : null}
    </div>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-xl font-bold leading-tight">{children}</h3>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line/10 bg-cream px-4 py-4 card-shadow ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-3xl border border-dashed border-line/20 bg-cream/60 px-4 py-5 text-base leading-snug text-ink-soft">
      {children}
    </p>
  );
}

const labelClass = "text-sm font-bold text-ink-soft";
const inputClass =
  "mt-1.5 w-full rounded-2xl border border-line/15 bg-paper/30 px-4 text-base text-ink placeholder:text-ink-soft/50 focus:border-brick/50 focus:outline-none focus:ring-4 focus:ring-brick/10";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={`min-h-12 ${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea rows={2} {...props} className={`block py-3 leading-snug ${inputClass} ${props.className ?? ""}`} />;
}

export function ChoiceRow<T extends string>({
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
    <fieldset className="mt-4 first:mt-0">
      <legend className={labelClass}>{legend}</legend>
      <div className={`mt-1.5 grid gap-2 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              aria-label={nameFor(option)}
              onClick={() => onChange(option)}
              className={`min-h-12 rounded-2xl border text-base font-bold capitalize transition-colors ${
                selected
                  ? "border-brick/60 bg-brick/10 text-brick"
                  : "border-line/15 bg-paper/30 text-ink-soft"
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

export function PrimaryButton({ children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="submit"
      {...props}
      className={`tap mt-5 w-full rounded-2xl bg-brick px-4 text-base font-bold text-cream shadow-[0_6px_16px_rgb(168_50_20/0.22)] ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  tone = "ocean",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: "ocean" | "brick" }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-12 items-center rounded-full px-3 text-sm font-bold disabled:cursor-default disabled:text-leaf ${
        tone === "brick" ? "text-brick" : "text-ocean"
      } ${className}`}
    />
  );
}

export function ItemActions({
  onEdit,
  onDelete,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="-mx-3 mt-1 flex gap-1">
      <QuietButton onClick={onEdit}>Edit</QuietButton>
      <QuietButton tone="brick" onClick={onDelete} aria-label={deleteLabel}>
        Delete
      </QuietButton>
    </div>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wide text-ink-soft/80">{children}</p>;
}
