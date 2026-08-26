import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Group = { category: string; options: string[] };

export function MultiSelect({
  options,
  groups,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  getLabel,
  selectedCountLabel,
  nothingFoundLabel = "Nothing found.",
}: {
  options?: string[];
  groups?: Group[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Display translator — values stay English for storage/logic. */
  getLabel?: (value: string) => string;
  /** e.g. tp("selected") so "3 selected" can be localized as `${n} ${selectedCountLabel}` */
  selectedCountLabel?: string;
  nothingFoundLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const effectiveGroups: Group[] = groups ?? [{ category: "", options: options ?? [] }];
  const label = (v: string) => {
    try {
      return getLabel ? getLabel(v) : v;
    } catch {
      return v;
    }
  };

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between rounded-xl border-border bg-secondary/50 px-3.5 text-sm font-normal"
          >
            <span className={selected.length ? "text-foreground" : "text-muted-foreground"}>
              {selected.length
                ? selectedCountLabel
                  ? `${selected.length} ${selectedCountLabel}`
                  : `${selected.length} selected`
                : placeholder}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-64">
              <CommandEmpty>{nothingFoundLabel}</CommandEmpty>
              {effectiveGroups.map((g) => (
                <CommandGroup
                  key={g.category || "_"}
                  heading={g.category ? label(g.category) : undefined}
                >
                  {g.options.map((o) => {
                    const on = selected.includes(o);
                    return (
                      <CommandItem
                        key={o}
                        value={o}
                        keywords={[label(o)]}
                        onSelect={() => toggle(o)}
                        className="cursor-pointer"
                      >
                        <span
                          className={`mr-2 flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-input"
                          }`}
                        >
                          {on && <Check className="size-3" />}
                        </span>
                        {label(o)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 rounded-full pl-2.5 pr-1.5 font-normal">
              {label(s)}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                aria-label={`Remove ${label(s)}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
