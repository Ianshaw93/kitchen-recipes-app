import { SiteHeader } from "@/components/SiteHeader";
import { TogetherHorsemen } from "@/components/TogetherHorsemen";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Dev · Four Horsemen", "Work in progress. Not linked from the app.");

export default function UsDevPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <main className="mx-auto max-w-xl space-y-6 px-4 sm:px-6">
        <p className="rounded-2xl border border-dashed border-line/25 bg-cream/60 px-4 py-3 text-sm font-semibold text-ink-soft">
          Dev area. Not linked from the app.
        </p>
        <TogetherHorsemen />
      </main>
    </div>
  );
}
