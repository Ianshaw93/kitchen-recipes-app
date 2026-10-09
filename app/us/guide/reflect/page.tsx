import { GuideReflect } from "@/components/GuideReflect";
import { usMetadata } from "@/lib/us-metadata";

export const metadata = usMetadata("Reflect · Guide", "Empathy prompts for the notepad.");

export default function GuideReflectPage() {
  return <GuideReflect />;
}
