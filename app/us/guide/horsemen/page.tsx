import { HorsemenReference } from "@/components/HorsemenReference";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Four Horsemen · Guide", "Spot the pattern in your own writing.");

export default function GuideHorsemenPage() {
  return <HorsemenReference framing="journal" />;
}
