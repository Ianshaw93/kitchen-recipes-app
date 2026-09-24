import type { Metadata } from "next";
import { HomesScoper } from "@/components/HomesScoper";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Homes",
  description: "Weekly Kelvindale-area house shortlist. Ian and Abby vote independently.",
};

export default function HomesPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <HomesScoper />
    </div>
  );
}
