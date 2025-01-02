import { useState } from "react";
import { CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FilterCategory {
  name: string;
  items: string[];
}

const filterCategories: FilterCategory[] = [
  {
    name: "Owner",
    items: ["Finance", "Risk", "Operations", "Technology"],
  },
  {
    name: "Update Frequency",
    items: ["Daily", "Weekly", "Monthly", "Quarterly"],
  },
  {
    name: "Tags",
    items: ["Critical", "Regulatory", "External", "Internal"],
  },
  {
    name: "SLA",
    items: ["High", "Medium", "Low"],
  },
];

interface QuickFilterSidebarProps {
  onFiltersChange: (filters: Record<string, string[]>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function QuickFilterSidebar({ 
  onFiltersChange, 
  isExpanded, 
  onToggleExpand 
}: QuickFilterSidebarProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const toggleFilter = (category: string, item: string) => {
    setSelectedFilters((prev) => {
      const categoryFilters = prev[category] || [];
      const newCategoryFilters = categoryFilters.includes(item)
        ? categoryFilters.filter((i) => i !== item)
        : [...categoryFilters, item];

      const newFilters = {
        ...prev,
        [category]: newCategoryFilters,
      };

      // Remove empty categories
      if (newFilters[category].length === 0) {
        delete newFilters[category];
      }

      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const isSelected = (category: string, item: string) => {
    return (selectedFilters[category] || []).includes(item);
  };

  return (
    <SidebarProvider>
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? "16rem" : "3rem" }}
        className="relative border-r border-border bg-background"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-3 z-20 h-6 w-6 rounded-full border bg-background shadow-md"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <Sidebar className={`h-full transition-all duration-300 ${isExpanded ? 'w-64' : 'w-12'}`}>
          <SidebarHeader className="border-b border-border">
            {isExpanded && (
              <h2 className="px-2 text-lg font-semibold">Quick Filters</h2>
            )}
          </SidebarHeader>
          <SidebarContent>
            {isExpanded && filterCategories.map((category) => (
              <SidebarGroup key={category.name}>
                <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  {category.items.map((item) => (
                    <SidebarMenuButton
                      key={`${category.name}-${item}`}
                      onClick={() => toggleFilter(category.name, item)}
                      className="group flex items-center gap-2 py-1 hover:bg-accent hover:text-accent-foreground"
                    >
                      {isSelected(category.name, item) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      )}
                      <span className="text-sm">{item}</span>
                      <span className="ml-auto text-xs text-muted-foreground">0</span>
                    </SidebarMenuButton>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
      </motion.div>
    </SidebarProvider>
  );
}