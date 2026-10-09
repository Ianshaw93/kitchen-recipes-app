import type { ReactNode } from "react";
import { UsShell } from "@/components/UsShell";
import { usMetadata } from "@/lib/us-metadata";
import { GUIDE_SECTIONS } from "@/lib/us-sections";

export const metadata = usMetadata("Guide", "Avery's journaling guide. Nothing typed here is stored.");

export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <UsShell
      eyebrow="Avery"
      title="Guide"
      intro="Read this while you journal in your notepad. Nothing you write is saved on the server."
      crossLink={{ href: "/us", label: "Together", back: true }}
      sections={GUIDE_SECTIONS}
      tabsLabel="Guide sections"
    >
      {children}
    </UsShell>
  );
}
