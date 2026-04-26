import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ISO_COUNTRIES, getIsoCountry } from "@/data/isoCountries";
import { cn } from "@/lib/utils";

interface CountryComboboxProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CountryCombobox({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: CountryComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = getIsoCountry(value);
  const effectivePlaceholder = placeholder ?? t("countryCombobox.selectCountry");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between bg-background font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selected ? (
              <>
                <span className="mr-2">{selected.flag}</span>
                {selected.name}{" "}
                <span className="text-muted-foreground">({selected.code})</span>
              </>
            ) : (
              effectivePlaceholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder={t("countryCombobox.searchCountries")} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>{t("countryCombobox.noCountryFound")}</CommandEmpty>
            <CommandGroup>
              {ISO_COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.code}
                  </span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === c.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
