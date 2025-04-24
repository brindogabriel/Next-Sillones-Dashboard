"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  name: string;
  type?: string;
  cost?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) => {
      // Validación segura para evitar errores con valores undefined
      const name = option.name || "";
      const type = option.type || "";
      const searchTerm = searchValue.toLowerCase();

      // Búsqueda tanto en nombre como en tipo
      return (
        name.toLowerCase().includes(searchTerm) ||
        type.toLowerCase().includes(searchTerm)
      );
    });
  }, [options, searchValue]);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const selectAll = () => {
    onChange(options.map((option) => option.value));
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              options
                .filter((option) => selected.includes(option.value))
                .map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1 flex items-center gap-1"
                  >
                    <span>
                      {option.name}
                      {option.type && ` (${option.type})`}{" "}
                      {/* Solo muestra si existe */}
                      {option.cost !== undefined &&
                        ` $${option.cost.toFixed(2)}`}
                    </span>
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <CommandInput
              placeholder="Buscar materiales..."
              className="pl-9"
              value={searchValue}
              onValueChange={setSearchValue}
            />
          </div>
          <CommandEmpty>No se encontraron materiales.</CommandEmpty>
          <ScrollArea className="h-64">
            <CommandGroup>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                <span>Materiales</span>
                {selected.length === options.length ? (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={deselectAll}
                  >
                    Deseleccionar todos
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={selectAll}
                  >
                    Seleccionar todos
                  </button>
                )}
              </div>
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(option.value)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium">
                        {option.name}
                        {option.type && (
                          <span className="text-muted-foreground">
                            ({option.type})
                          </span>
                        )}
                      </span>
                      {option.cost !== undefined && (
                        <span className="ml-auto text-sm font-medium">
                          ${option.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
