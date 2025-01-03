import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface DataProduct {
  id: number;
  name: string;
  description?: string;
  owner: string;
  domain: string;
  tags?: string[];
}

interface HierarchicalViewProps {
  dataProducts: DataProduct[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}

type GroupingKey = "domain" | "owner" | "tags";

export default function HierarchicalView({ dataProducts, onSelect, selectedId }: HierarchicalViewProps) {
  const [groupBy, setGroupBy] = useState<GroupingKey>("domain");

  const groupData = (data: DataProduct[], key: GroupingKey) => {
    const grouped = new Map<string, DataProduct[]>();

    if (key === "tags") {
      // Special handling for tags since it's an array
      data.forEach(product => {
        (product.tags || []).forEach(tag => {
          if (!grouped.has(tag)) {
            grouped.set(tag, []);
          }
          grouped.get(tag)?.push(product);
        });
      });
    } else {
      // Grouping by domain or owner
      data.forEach(product => {
        const value = product[key];
        if (!grouped.has(value)) {
          grouped.set(value, []);
        }
        grouped.get(value)?.push(product);
      });
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  };

  const groupedData = groupData(dataProducts, groupBy);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Group by:</span>
        <Select value={groupBy} onValueChange={(value: GroupingKey) => setGroupBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="tags">Tags</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" className="w-full">
        {groupedData.map(([group, products]) => (
          <AccordionItem key={group} value={group}>
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span>{group}</span>
                <Badge variant="secondary">{products.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                {products.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedId === product.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => onSelect(product.id)}
                  >
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm mt-1 opacity-80">{product.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{product.domain}</Badge>
                      <Badge variant="outline">{product.owner}</Badge>
                      {product.tags?.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
