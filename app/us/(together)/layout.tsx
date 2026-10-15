import type { ReactNode } from "react";
import { RelationshipSyncError } from "@/components/RelationshipSyncError";
import { UsShell } from "@/components/UsShell";
import { RelationshipProvider } from "@/lib/relationship-context";
import { usMetadata } from "@/lib/us-metadata";
import { TOGETHER_SECTIONS } from "@/lib/us-sections";

export const metadata = usMetadata("Together", "Notes for Ian and Avery.");

export default function TogetherLayout({ children }: { children: ReactNode }) {
  return (
    <RelationshipProvider>
      <UsShell
        title="Together"
        intro="For sitting down side by side."
        crossLink={{ href: "/us/guide", label: "Avery's guide" }}
        sections={TOGETHER_SECTIONS}
        tabsLabel="Together sections"
        notice={<RelationshipSyncError />}
      >
        {children}
      </UsShell>
    </RelationshipProvider>
  );
}
