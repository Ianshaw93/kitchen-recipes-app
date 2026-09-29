"use client";

import { useEffect, useState } from "react";
import { fetchHomeOptionPreview, homeOptionImageSrc } from "@/lib/shop-client";
import type { HomeItem, HomeItemOption } from "@/lib/shop-home";

export function HomeItemDetail({ item, onBack }: { item: HomeItem; onBack: () => void }) {
  const detail = item.detail;
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const pending = detail?.options.filter((option) => !option.imageUrl) ?? [];
    if (pending.length === 0) {
      return;
    }

    let cancelled = false;
    void Promise.all(
      pending.map(async (option) => {
        const imageUrl = await fetchHomeOptionPreview(option.url);
        return [option.url, imageUrl] as const;
      }),
    ).then((pairs) => {
      if (cancelled) {
        return;
      }
      const next: Record<string, string> = {};
      for (const [url, imageUrl] of pairs) {
        if (imageUrl) {
          next[url] = imageUrl;
        }
      }
      if (Object.keys(next).length > 0) {
        setImages(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [detail]);

  if (!detail) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="tap inline-flex items-center rounded-full border-2 border-line/20 bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-ink"
      >
        Back to shop
      </button>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{item.label}</h1>
      <p className="mt-2 text-base leading-snug text-ink-soft">{detail.intro}</p>

      <h2 className="mt-8 font-display text-2xl font-bold">My shortlist</h2>
      <ol className="mt-4 space-y-4">
        {detail.options.map((option, index) => (
          <li key={option.url}>
            <OptionCard option={option} index={index} imageUrl={images[option.url] ?? option.imageUrl} />
          </li>
        ))}
      </ol>

      <h2 className="mt-8 font-display text-2xl font-bold">{detail.buyTitle}</h2>
      {detail.buyIntro ? (
        <p className="mt-2 text-base font-semibold leading-snug">{detail.buyIntro}</p>
      ) : null}
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-snug">
        {detail.buyBullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      {detail.runningCost ? (
        <div className="mt-8 rounded-3xl border-2 border-line/15 bg-cream px-4 py-4">
          <h2 className="font-display text-2xl font-bold">Running cost note</h2>
          <p className="mt-2 text-base leading-snug">{detail.runningCost}</p>
        </div>
      ) : null}
    </div>
  );
}

function OptionCard({
  option,
  index,
  imageUrl,
}: {
  option: HomeItemOption;
  index: number;
  imageUrl?: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
      {imageUrl ? <OptionPhoto src={homeOptionImageSrc(imageUrl)} alt={option.title} /> : null}
      <div className="p-4">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-brick">
          Option {index + 1}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold leading-tight">{option.title}</h3>
        {option.priceNote ? <p className="mt-2 text-base font-bold">{option.priceNote}</p> : null}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold leading-snug text-ink-soft">
          {option.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <a
          href={option.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tap mt-4 flex w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold uppercase tracking-wide text-cream"
        >
          View on {option.retailer}
        </a>
      </div>
    </article>
  );
}

function OptionPhoto({ src, alt }: { src: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return null;
  }

  return (
    // Retailer image hosts are only known after the listing preview fetch.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHidden(true)}
      className="aspect-[16/10] w-full bg-paper object-cover"
    />
  );
}
