"use client";

import { SectionTabs } from "@/components/SectionNav";
import { useHasUnseenBehaviourTags } from "@/lib/use-behaviour-tags";
import { TOGETHER_SECTIONS } from "@/lib/us-sections";

export function TogetherSectionTabs() {
  const hasNew = useHasUnseenBehaviourTags();
  return <SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" badges={{ horsemen: hasNew }} />;
}
