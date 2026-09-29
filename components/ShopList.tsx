"use client";

import { type FormEvent, useState } from "react";
import { isLabelOnThisWeek, type HomeItem, type ShopListId, type ShopSectionId } from "@/lib/shop";
import { useShop } from "@/lib/use-shop";
import { HomeItemDetail } from "./HomeItemDetail";
import { TickBox } from "./TickBox";

function NeedThisWeekButton({
  label,
  already,
  onNeed,
}: {
  label: string;
  already: boolean;
  onNeed: () => void;
}) {
  return (
    <button
      type="button"
      disabled={already}
      onClick={onNeed}
      aria-label={already ? `${label} is already on this week` : `Need ${label} this week`}
      className={`tap ml-11 inline-flex items-center rounded-full px-3 text-xs font-extrabold uppercase tracking-wide ${
        already ? "text-ink-soft" : "bg-ocean/10 text-ocean"
      }`}
    >
      {already ? "On this week" : "Need this week"}
    </button>
  );
}

const sections: Array<{
  id: ShopSectionId;
  title: string;
  blurb: string;
  empty: string;
}> = [
  {
    id: "fewWeeks",
    title: "Every few weeks",
    blurb: "Standing household and pantry restocks.",
    empty: "Nothing on this restock list.",
  },
  {
    id: "thisWeek",
    title: "This week specials",
    blurb: "One-off extras, plus standing items you need this shop.",
    empty: "Nothing extra this week. Add a one-off, or leave it for chat to fill in later.",
  },
  {
    id: "asian",
    title: "Asian store",
    blurb: "Filipino and Asian grocery run.",
    empty: "Nothing for the Asian shop.",
  },
];

export function ShopList() {
  const { shop, hydrated, syncError, toggle, add, clear, needThisWeek } = useShop();
  const [openHomeId, setOpenHomeId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<ShopListId, string>>({
    fewWeeks: "",
    thisWeek: "",
    asian: "",
    home: "",
  });

  async function onAdd(event: FormEvent<HTMLFormElement>, section: ShopListId) {
    event.preventDefault();
    const label = drafts[section].trim();
    if (!label) {
      return;
    }
    const saved = await add(section, label);
    if (saved) {
      setDrafts((current) => ({ ...current, [section]: "" }));
    }
  }

  const openHome = shop?.homeItems.find((item) => item.id === openHomeId && item.detail) ?? null;

  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6">
      {openHome ? (
        <HomeItemDetail item={openHome} onBack={() => setOpenHomeId(null)} />
      ) : (
        <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Shop</h1>
      <p className="mt-2 text-base leading-snug text-ink-soft">
        Household bits outside the weekly meal shop, plus bigger home buys. Ian and Avery share the
        same ticks.
      </p>
      {syncError ? (
        <p className="mt-3 text-base font-bold text-brick" role="alert">
          {syncError}
        </p>
      ) : null}

      <div className="mt-8 space-y-10" aria-busy={!hydrated}>
        {sections.map((section) => {
          const items = shop?.sections[section.id] ?? [];
          const done = items.filter((item) => item.done).length;
          const inputId = `shop-add-${section.id}`;
          return (
            <section key={section.id} aria-labelledby={`shop-${section.id}`}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 id={`shop-${section.id}`} className="font-display text-2xl font-bold">
                    {section.title}
                  </h2>
                  <p className="text-sm font-semibold text-ink-soft">{section.blurb}</p>
                  <p className="text-sm font-semibold text-ink-soft">
                    Tap to tick · {hydrated ? `${done}/${items.length}` : "…"}
                  </p>
                </div>
                {done > 0 ? (
                  <button
                    type="button"
                    onClick={() => void clear(section.id)}
                    aria-label={`Clear ${section.title} ticks`}
                    className="tap rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
                  >
                    Clear ticks
                  </button>
                ) : null}
              </div>

              {!hydrated ? (
                <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
                  Loading the shared list…
                </p>
              ) : items.length === 0 ? (
                <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
                  {section.empty}
                </p>
              ) : (
                <ul className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
                  {items.map((item, index) => {
                    const standingSection = section.id === "thisWeek" ? null : section.id;
                    return (
                    <li key={item.id} className={index === 0 ? "" : "border-t-2 border-line/10"}>
                      <button
                        type="button"
                        onClick={() => void toggle(section.id, item.id)}
                        aria-pressed={item.done}
                        className="tap flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <TickBox on={item.done} />
                        <span className="min-w-0">
                          <span
                            className={`block text-lg font-semibold leading-snug ${
                              item.done ? "text-ink-soft line-through" : "text-ink"
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.note ? (
                            <span className="mt-0.5 block text-sm font-semibold text-ink-soft">
                              {item.note}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      {standingSection ? (
                        <div className="px-4 pb-3">
                          <NeedThisWeekButton
                            label={item.label}
                            already={Boolean(shop && isLabelOnThisWeek(shop.sections, item.label))}
                            onNeed={() => void needThisWeek(standingSection, item.id)}
                          />
                        </div>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              )}

              <form onSubmit={(event) => void onAdd(event, section.id)} className="mt-3 flex gap-2">
                <label htmlFor={inputId} className="sr-only">
                  Add to {section.title}
                </label>
                <input
                  id={inputId}
                  value={drafts[section.id]}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [section.id]: event.target.value }))
                  }
                  placeholder="Add an item"
                  autoComplete="off"
                  enterKeyHint="done"
                  className="tap min-w-0 flex-1 rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink outline-none focus:border-ink"
                />
                <button
                  type="submit"
                  aria-label={`Add to ${section.title}`}
                  className="tap shrink-0 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
                >
                  Add
                </button>
              </form>
            </section>
          );
        })}

        <HomeItemsSection
          items={shop?.homeItems ?? []}
          hydrated={hydrated}
          draft={drafts.home}
          onDraft={(value) => setDrafts((current) => ({ ...current, home: value }))}
          onAdd={(event) => void onAdd(event, "home")}
          onToggle={(id) => void toggle("home", id)}
          onOpen={(id) => setOpenHomeId(id)}
          onClear={() => void clear("home")}
        />
      </div>
        </>
      )}
    </main>
  );
}

function HomeItemsSection({
  items,
  hydrated,
  draft,
  onDraft,
  onAdd,
  onToggle,
  onOpen,
  onClear,
}: {
  items: HomeItem[];
  hydrated: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onClear: () => void;
}) {
  const done = items.filter((item) => item.done).length;

  return (
    <section aria-labelledby="shop-home" className="rounded-[1.75rem] border-2 border-brick/35 bg-brick/5 p-4">
      <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">Bigger buys</p>
      <div className="mb-3 mt-1 flex items-end justify-between gap-3">
        <div>
          <h2 id="shop-home" className="font-display text-2xl font-bold">
            Home items
          </h2>
          <p className="text-sm font-semibold text-ink-soft">
            Furniture, heaters, cooking kit — not the weekly grocery shop.
          </p>
          <p className="text-sm font-semibold text-ink-soft">
            Tick the box · open the name for research · {hydrated ? `${done}/${items.length}` : "…"}
          </p>
        </div>
        {done > 0 ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear Home items ticks"
            className="tap rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
          >
            Clear ticks
          </button>
        ) : null}
      </div>

      {!hydrated ? (
        <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
          Loading the shared list…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
          Nothing on the home list yet.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
          {items.map((item, index) => (
            <li key={item.id} className={index === 0 ? "" : "border-t-2 border-line/10"}>
              {item.detail ? (
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => onToggle(item.id)}
                    aria-pressed={item.done}
                    aria-label={`Tick ${item.label}`}
                    className="tap flex items-center px-4"
                  >
                    <TickBox on={item.done} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpen(item.id)}
                    aria-label={`Open ${item.label}`}
                    className="tap flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-lg font-semibold leading-snug ${
                          item.done ? "text-ink-soft line-through" : "text-ink"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink-soft">Shortlist</span>
                    </span>
                    <span aria-hidden="true" className="text-2xl leading-none text-ink-soft">
                      ›
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-pressed={item.done}
                  className="tap flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <TickBox on={item.done} />
                  <span className="min-w-0">
                    <span
                      className={`block text-lg font-semibold leading-snug ${
                        item.done ? "text-ink-soft line-through" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.note ? (
                      <span className="mt-0.5 block text-sm font-semibold text-ink-soft">{item.note}</span>
                    ) : null}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="mt-3 flex gap-2">
        <label htmlFor="shop-add-home" className="sr-only">
          Add to Home items
        </label>
        <input
          id="shop-add-home"
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder="Add a home item"
          autoComplete="off"
          enterKeyHint="done"
          className="tap min-w-0 flex-1 rounded-2xl border-2 border-line/20 bg-cream px-4 text-base font-semibold text-ink outline-none focus:border-ink"
        />
        <button
          type="submit"
          aria-label="Add to Home items"
          className="tap shrink-0 rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
        >
          Add
        </button>
      </form>
    </section>
  );
}
