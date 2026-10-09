import { TogetherListening } from "@/components/TogetherListening";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Listening · Together", "Speaker-Listener checklist and session takeaways.");

export default function ListeningPage() {
  return <TogetherListening />;
}
