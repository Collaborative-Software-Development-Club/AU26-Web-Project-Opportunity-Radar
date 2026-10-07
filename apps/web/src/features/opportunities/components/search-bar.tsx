import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 focus-within:ring-2 focus-within:ring-ring">
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label="Search opportunities"
        placeholder="Search by keyword, organization, or location…"
        className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
