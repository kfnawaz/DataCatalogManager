import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Version {
  id: number;
  version: number;
  name: string;
  description: string;
  type: string;
  formula?: string;
  parameters?: Record<string, any>;
  createdAt: string;
  changeMessage?: string;
}

interface MetricVersionHistoryProps {
  metricId: number;
  isOpen: boolean;
  onClose: () => void;
  onRollback: () => void;
}

export default function MetricVersionHistory({
  metricId,
  isOpen,
  onClose,
  onRollback,
}: MetricVersionHistoryProps) {
  const { toast } = useToast();

  const { data: versions } = useQuery<Version[]>({
    queryKey: [`/api/metric-definitions/${metricId}/history`],
    enabled: isOpen,
  });

  const handleRollback = async (versionId: number) => {
    try {
      const response = await fetch(
        `/api/metric-definitions/${metricId}/rollback/${versionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "Successfully rolled back to selected version",
      });
      
      onRollback();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions?.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <Badge variant="outline">v{version.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{version.name}</div>
                      {version.changeMessage && (
                        <div className="text-sm text-muted-foreground">
                          {version.changeMessage}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(version.createdAt), "PPpp")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRollback(version.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
