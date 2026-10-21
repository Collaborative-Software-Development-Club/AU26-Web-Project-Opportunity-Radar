// How each category is presented on the discovery page. `slug` matches categories.slug.
import type { CategoryView } from "@radar/contracts";
import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  Tag,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type DiscoveryCategory = {
  slug: string;
  label: string;
  icon: LucideIcon;
  // Full class strings so Tailwind can detect them.
  accentClass: string;
  chipClass: string;
  badgeClass: string;
};

export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  {
    slug: "scholarships",
    label: "Scholarships",
    icon: GraduationCap,
    accentClass: "text-teal-700",
    chipClass: "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800",
    badgeClass: "bg-teal-50 text-teal-700",
  },
  {
    slug: "competitions",
    label: "Competitions",
    icon: Trophy,
    accentClass: "text-violet-700",
    chipClass:
      "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800",
    badgeClass: "bg-violet-50 text-violet-700",
  },
  {
    slug: "career-events",
    label: "Career Events",
    icon: CalendarDays,
    accentClass: "text-orange-600",
    chipClass:
      "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700",
    badgeClass: "bg-orange-50 text-orange-600",
  },
  {
    slug: "jobs-internships",
    label: "Jobs & Internships",
    icon: Briefcase,
    accentClass: "text-rose-700",
    chipClass: "bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800",
    badgeClass: "bg-rose-50 text-rose-700",
  },
];

const FALLBACK_STYLE: Omit<DiscoveryCategory, "slug" | "label"> = {
  icon: Tag,
  accentClass: "text-foreground",
  chipClass: "bg-muted text-foreground hover:bg-accent",
  badgeClass: "",
};

export function discoveryCategoryFor(category: CategoryView): DiscoveryCategory {
  const preset = DISCOVERY_CATEGORIES.find(({ slug }) => slug === category.slug);
  return preset ?? { ...FALLBACK_STYLE, slug: category.slug, label: category.name };
}

export function badgeClassFor(categories: CategoryView[]) {
  const [first] = categories;
  return first ? discoveryCategoryFor(first).badgeClass : "";
}
