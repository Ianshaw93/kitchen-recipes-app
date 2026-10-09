import { OurStandards } from "@/components/OurStandards";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Together", "Notes for Ian and Avery.");

export default function UsPage() {
  return <OurStandards />;
}
