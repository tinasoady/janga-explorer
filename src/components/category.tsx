import { BedDouble, CalendarDays, Footprints, Utensils, type LucideIcon } from "lucide-react";
import type { CategoryKey } from "@/lib/types";

export const CATEGORY_STYLE: Record<CategoryKey, { icon: LucideIcon; bg: string; text: string }> = {
  manger: { icon: Utensils, bg: "bg-cat-manger", text: "text-cat-manger" },
  dormir: { icon: BedDouble, bg: "bg-cat-dormir", text: "text-cat-dormir" },
  activites: { icon: Footprints, bg: "bg-cat-activites", text: "text-cat-activites" },
  sorties: { icon: CalendarDays, bg: "bg-cat-sorties", text: "text-cat-sorties" },
};

export function CategoryIcon({ category, className = "size-3.5" }: { category: CategoryKey; className?: string }) {
  const { icon: Icon, text } = CATEGORY_STYLE[category];
  return <Icon className={`${className} ${text} shrink-0`} aria-hidden />;
}
