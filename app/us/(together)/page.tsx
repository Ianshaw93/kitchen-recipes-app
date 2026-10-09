import type { Metadata } from "next";
import { RelationshipPage } from "@/components/RelationshipPage";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Us",
  description: "Notes for Ian and Avery.",
  robots: { index: false, follow: false },
};

export default function UsPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <RelationshipPage />
    </div>
  );
}
