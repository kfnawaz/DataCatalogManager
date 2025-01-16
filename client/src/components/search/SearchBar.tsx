import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Tag } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { DialogTitle } from "@/components/ui/dialog";

interface SearchBarProps {
  onSelect: (id: number) => void;
  initialValue?: number | null;
  className?: string;
}

interface DataProduct {
  id: number;
  name: string;
  description?: string;
  domain: string;
  owner: string;
  tags?: string[];
}

export default function SearchBar({ onSelect, initialValue, className }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [recentItems, setRecentItems] = useState<DataProduct[]>([]);

  const { data: searchResults, isLoading } = useQuery<DataProduct[]>({
    queryKey: ["/api/data-products"],
    staleTime: 30000,
  });

  // Update selected product when initialValue changes
  useEffect(() => {
    if (initialValue && searchResults) {
      const product = searchResults.find(p => p.id === initialValue);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [initialValue, searchResults]);

  // Add keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter and sort results based on search input
  const filteredResults = searchResults?.filter(item => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.domain.toLowerCase().includes(searchLower) ||
      item.owner.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = (item: DataProduct) => {
    setSelectedProduct(item);
    onSelect(item.id);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-2 h-10 px-4 py-2 text-sm text-muted-foreground border rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
        aria-label="Search data products (⌘K)"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left truncate">
          {selectedProduct ? selectedProduct.name : "Search data products..."}
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </button>

      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
      >
        <DialogTitle className="sr-only">Search Data Products</DialogTitle>
        <CommandInput 
          placeholder="Type to search data products..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading data products...
            </div>
          ) : (
            <CommandGroup heading="Data Products">
              {filteredResults?.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className="flex items-start gap-2 p-2"
                >
                  <Tag className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span>{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{item.domain}</Badge>
                      <Badge variant="outline">{item.owner}</Badge>
                      {item.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
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