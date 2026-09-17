import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsTracker, PaymentsTrackerRoute } from "@/components/PaymentsTracker";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Payments",
  description: "Log who paid for shared household spends. Ian and Avery split 50/50.",
};

export default function PaymentsPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <Suspense fallback={<PaymentsTracker />}>
        <PaymentsTrackerRoute />
      </Suspense>
    </div>
  );
}
