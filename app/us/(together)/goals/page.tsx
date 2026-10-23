import { TogetherGoals } from "@/components/TogetherGoals";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Goals · Together", "Goals, the actions under each one, and when they happen.");

export default function GoalsPage() {
  return <TogetherGoals />;
}
