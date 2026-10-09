import { TogetherReviewed } from "@/components/TogetherReviewed";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Reviewed · Together", "Weekly prompt, reviewed-together log, and check-in list.");

export default function ReviewedPage() {
  return <TogetherReviewed />;
}
