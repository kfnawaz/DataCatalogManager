import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Clock, Tag } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  onSelect: (id: number) => void;
  initialValue?: number | null;
  className?: string;
}

interface DataProduct {
  id: number;
  name: string;
  description?: string;
  tags?: string[];
}

const MAX_RECENT_ITEMS = 5;

export default function SearchBar({ onSelect, initialValue, className }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [recentItems, setRecentItems] = useState<DataProduct[]>([]);

  // Load recent items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentDataProducts');
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading recent items:', e);
    }
  }, []);

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

  // Filter and sort results based on search input
  const filteredResults = searchResults?.filter(item => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = (item: DataProduct) => {
    try {
      onSelect(item.id);
      setSelectedProduct(item);
      setOpen(false);

      // Update recent items
      const newRecent = [
        item,
        ...recentItems.filter(i => i.id !== item.id)
      ].slice(0, MAX_RECENT_ITEMS);

      setRecentItems(newRecent);
      localStorage.setItem('recentDataProducts', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Error handling selection:', error);
    }
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
            <>
              {recentItems.length > 0 && !search && (
                <>
                  <CommandGroup heading="Recent">
                    {recentItems.map((item) => (
                      <CommandItem
                        key={`recent-${item.id}`}
                        onSelect={() => handleSelect(item)}
                        className="flex items-start gap-2 p-2"
                      >
                        <Clock className="h-4 w-4 mt-1 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span>{item.name}</span>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag) => (
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
                  <CommandSeparator />
                </>
              )}

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
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
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
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}