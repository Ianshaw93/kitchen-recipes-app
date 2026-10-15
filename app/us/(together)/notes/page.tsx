import { TogetherNotes } from "@/components/TogetherNotes";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Notes · Together", "Moments (wins and slips), things to work on, and the doc link.");

export default function NotesPage() {
  return <TogetherNotes />;
}
