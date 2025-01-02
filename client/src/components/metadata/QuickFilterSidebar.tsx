import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
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
}

export default function QuickFilterSidebar({ onFiltersChange }: QuickFilterSidebarProps) {
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
      <Sidebar className="w-64 border-r border-border">
        <SidebarHeader className="border-b border-border">
          <h2 className="px-2 text-lg font-semibold">Quick Filters</h2>
        </SidebarHeader>
        <SidebarContent>
          {filterCategories.map((category) => (
            <SidebarGroup key={category.name}>
              <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
              <SidebarGroupContent>
                {category.items.map((item) => (
                  <SidebarMenuButton
                    key={`${category.name}-${item}`}
                    onClick={() => toggleFilter(category.name, item)}
                    className="group flex items-center gap-2 py-1"
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
    </SidebarProvider>
  );
}