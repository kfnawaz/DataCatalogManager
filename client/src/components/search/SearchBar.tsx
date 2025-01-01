import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { Search, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  onSelect: (id: number) => void;
}

interface DataProduct {
  id: number;
  name: string;
  tags?: string[];
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const { data: products, isLoading, error } = useQuery<DataProduct[]>({
    queryKey: ["/api/data-products"],
  });

  const handleSelect = (id: number) => {
    console.log("Selected product ID:", id);
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 h-10 px-4 py-2 text-sm text-muted-foreground border rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search data products...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search data products..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading data products...
            </div>
          )}
          {error && (
            <div className="py-6 text-center">
              <p className="text-sm text-destructive">Failed to load data products</p>
            </div>
          )}
          {products && (
            <CommandGroup heading="Data Products">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelect(product.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{product.name}</span>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex gap-1">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}