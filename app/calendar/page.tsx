import type { Metadata } from "next";
import { Suspense } from "react";
import { CoupleCalendar, CoupleCalendarRoute } from "@/components/CoupleCalendar";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Shared couple calendar for Ian and Avery. Same events on both phones.",
};

export default function CalendarPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <Suspense fallback={<CoupleCalendar />}>
        <CoupleCalendarRoute />
      </Suspense>
    </div>
  );
}
