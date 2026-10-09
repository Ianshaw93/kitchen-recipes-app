import { HorsemenReference } from "@/components/HorsemenReference";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Four Horsemen · Together", "The four horsemen and their antidotes.");

export default function HorsemenPage() {
  return <HorsemenReference framing="together" />;
}
