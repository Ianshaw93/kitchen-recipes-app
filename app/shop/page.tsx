import type { Metadata } from "next";
import { ShopList } from "@/components/ShopList";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shared household lists for restocks, one-off extras, and the Asian grocery run. Not the weekly meal shop.",
};

export default function ShopPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <ShopList />
    </div>
  );
}
