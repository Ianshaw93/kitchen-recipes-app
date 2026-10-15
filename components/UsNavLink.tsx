"use client";

import Link from "next/link";
import { CountBadge } from "@/components/CountBadge";
import { useUnseenBehaviourTagCount } from "@/lib/use-behaviour-tags";

export function UsNavLink({ className, badge }: { className: string; badge: boolean }) {
  const unseen = useUnseenBehaviourTagCount(badge);
  return (
    <Link href="/us" className={className}>
      Us
      <CountBadge count={unseen} />
    </Link>
  );
}
