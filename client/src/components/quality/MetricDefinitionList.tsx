import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Pencil } from "lucide-react";
import MetricVersionHistory from "./MetricVersionHistory";
import MetricDefinitionForm from "./MetricDefinitionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MetricDefinition {
  id: number;
  name: string;
  description: string;
  type: string;
  formula?: string;
  enabled: boolean;
  templateId?: number;
  parameters?: Record<string, any>;
}

export default function MetricDefinitionList() {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const queryClient = useQueryClient();

  const { data: metrics, isLoading } = useQuery<MetricDefinition[]>({
    queryKey: ["/api/metric-definitions"],
  });

  const handleEdit = (metric: MetricDefinition) => {
    setSelectedMetric(metric);
    setIsEditing(true);
  };

  const handleViewHistory = (metric: MetricDefinition) => {
    setSelectedMetric(metric);
    setShowHistory(true);
  };

  const handleHistoryClose = () => {
    setShowHistory(false);
    setSelectedMetric(null);
    queryClient.invalidateQueries({ queryKey: ["/api/metric-definitions"] });
  };

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
    <>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="max-w-[300px]">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(metric)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewHistory(metric)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {selectedMetric && showHistory && (
        <MetricVersionHistory
          metricId={selectedMetric.id}
          isOpen={showHistory}
          onClose={handleHistoryClose}
          onRollback={handleHistoryClose}
        />
      )}

      {selectedMetric && isEditing && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-7xl w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Metric Definition</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <MetricDefinitionForm
                initialData={selectedMetric}
                onSuccess={() => {
                  setIsEditing(false);
                  setSelectedMetric(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/metric-definitions"] });
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}