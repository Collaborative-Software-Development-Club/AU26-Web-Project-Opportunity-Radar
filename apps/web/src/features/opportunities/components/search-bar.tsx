import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const SEARCH_DELAY_MS = 300;
const MAX_SEARCH_LENGTH = 200;

export function SearchBar({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (query: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, SEARCH_DELAY_MS);
  const lastSent = useRef(value);

  function send(query: string) {
    const trimmed = query.trim();
    if (trimmed === lastSent.current) return;
    lastSent.current = trimmed;
    onSearch(trimmed);
  }

  useEffect(() => send(debounced), [debounced]);

  useEffect(() => {
    if (value === lastSent.current) return;
    lastSent.current = value;
    setDraft(value);
  }, [value]);

  return (
    <form
      role="search"
      className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 focus-within:ring-2 focus-within:ring-ring"
      onSubmit={(event) => {
        event.preventDefault();
        send(draft);
      }}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label="Search opportunities"
        placeholder="Search opportunities by keyword…"
        maxLength={MAX_SEARCH_LENGTH}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
      />
    </form>
  );
}
