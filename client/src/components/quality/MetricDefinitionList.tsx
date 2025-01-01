import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MetricDefinition {
  id: number;
  name: string;
  description: string;
  type: string;
  formula?: string;
  enabled: boolean;
}

export default function MetricDefinitionList() {
  const { data: metrics, isLoading } = useQuery<MetricDefinition[]>({
    queryKey: ["/api/metric-definitions"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No metric definitions found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="max-w-[300px]">Description</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.id}>
              <TableCell className="font-medium">{metric.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {metric.type}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {metric.description}
              </TableCell>
              <TableCell>
                <Badge variant={metric.enabled ? "default" : "secondary"}>
                  {metric.enabled ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
