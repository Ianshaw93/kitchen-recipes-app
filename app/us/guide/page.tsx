import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { UsGuide } from "@/components/UsGuide";

export const metadata: Metadata = {
  title: "Guide",
  description: "Avery's journaling guide. Nothing typed here is stored.",
  robots: { index: false, follow: false },
};

export default function GuidePage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <UsGuide />
    </div>
  );
}
