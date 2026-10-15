"use client";

import { SectionTabs } from "@/components/SectionNav";
import { useUnseenBehaviourTagCount } from "@/lib/use-behaviour-tags";
import { TOGETHER_SECTIONS } from "@/lib/us-sections";

export function TogetherSectionTabs() {
  const unseen = useUnseenBehaviourTagCount();
  return <SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" badges={{ horsemen: unseen }} />;
}
