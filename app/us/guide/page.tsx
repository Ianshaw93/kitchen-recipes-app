import { OurStandards } from "@/components/OurStandards";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Guide", "Avery's journaling guide. Nothing typed here is stored.");

export default function GuidePage() {
  return <OurStandards />;
}
