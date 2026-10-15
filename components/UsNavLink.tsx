"use client";

import Link from "next/link";
import { NewDot } from "@/components/NewDot";
import { useHasUnseenBehaviourTags } from "@/lib/use-behaviour-tags";

export function UsNavLink({ className, badge }: { className: string; badge: boolean }) {
  const hasNew = useHasUnseenBehaviourTags(badge);
  return (
    <Link href="/us" className={className}>
      Us
      {hasNew ? <NewDot /> : null}
    </Link>
  );
}
