import { WORK_MODES, type LocationView, type WorkMode } from "@radar/contracts";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscoveryFilters } from "../discovery-filters";
import { WORK_MODE_LABELS } from "../work-mode-labels";

type Option = { label: string; value: string };

export function FilterPanel({
  locations,
  filters,
  hasFilters,
  onChange,
  onClear,
}: {
  locations: LocationView[];
  filters: DiscoveryFilters;
  hasFilters: boolean;
  onChange: (changes: Partial<DiscoveryFilters>) => void;
  onClear: () => void;
}) {
  const { states, cities } = locationOptions(locations);
  const workModes = WORK_MODES.map((mode) => ({ label: WORK_MODE_LABELS[mode], value: mode }));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        items={[{ label: "Any location", value: null }, ...states, ...cities]}
        value={filters.location ?? null}
        onValueChange={(location) => onChange({ location: location ?? undefined })}
      >
        <SelectTrigger aria-label="Location" className="min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Any location</SelectItem>
          <OptionGroup label="States" options={states} />
          <OptionGroup label="Cities" options={cities} />
        </SelectContent>
      </Select>

      <Select
        items={[{ label: "Any work mode", value: null }, ...workModes]}
        value={filters.workMode ?? null}
        onValueChange={(workMode: WorkMode | null) => onChange({ workMode: workMode ?? undefined })}
      >
        <SelectTrigger aria-label="Work mode" className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Any work mode</SelectItem>
          {workModes.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" onClick={onClear}>
          <X aria-hidden />
          Clear filters
        </Button>
      )}
    </div>
  );
}

function OptionGroup({ label, options }: { label: string; options: Option[] }) {
  if (!options.length) return null;
  return (
    <SelectGroup>
      <SelectLabel>{label}</SelectLabel>
      {options.map(({ label, value }) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ))}
    </SelectGroup>
  );
}

function locationOptions(locations: LocationView[]) {
  const states = new Map<string, Option>();
  const cities = new Map<string, Option>();
  for (const { city, stateRegion } of locations) {
    if (stateRegion && !states.has(stateRegion))
      states.set(stateRegion, { label: stateRegion, value: stateRegion });
    if (city && !cities.has(city))
      cities.set(city, { label: [city, stateRegion].filter(Boolean).join(", "), value: city });
  }
  const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label);
  return {
    states: [...states.values()].sort(byLabel),
    cities: [...cities.values()].filter(({ value }) => !states.has(value)).sort(byLabel),
  };
}
