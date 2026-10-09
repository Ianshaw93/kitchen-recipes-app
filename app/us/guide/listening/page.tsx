import { ListeningChecklist } from "@/components/ListeningChecklist";
import { usMetadata } from "@/lib/us-metadata";
import { GUIDE_LISTENING_KEY } from "@/lib/us-guide";

export const metadata = usMetadata("Listening · Guide", "Speaker-Listener checklist, ticked on this phone only.");

export default function GuideListeningPage() {
  return <ListeningChecklist storageKey={GUIDE_LISTENING_KEY} notepadPlan />;
}
