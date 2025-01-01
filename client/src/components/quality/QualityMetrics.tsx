import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import MetricDefinitionForm from "./MetricDefinitionForm";

interface MetricHistory {
  timestamp: string;
  completeness: number;
  accuracy: number;
  timeliness: number;
}

interface CustomMetric {
  id: number;
  name: string;
  description?: string;
  query: string;
  threshold?: number;
  enabled: boolean;
}

interface MetricData {
  current: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    customMetrics: CustomMetric[];
  };
  history: MetricHistory[];
}

interface QualityMetricsProps {
  dataProductId: number | null;
}

export default function QualityMetrics({ dataProductId }: QualityMetricsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: metrics, isLoading } = useQuery<MetricData>({
    queryKey: ["/api/quality-metrics", dataProductId],
    queryFn: async () => {
      if (!dataProductId) throw new Error("No data product selected");
      const response = await fetch(`/api/quality-metrics/${dataProductId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch quality metrics: ${await response.text()}`);
      }
      return response.json();
    },
    enabled: dataProductId !== null,
  });

  if (!dataProductId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a data product to view its quality metrics
      </div>
    );
  }

  if (isLoading || !metrics) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  const formattedData = metrics.history?.map((item) => ({
    ...item,
    timestamp: format(new Date(item.timestamp), "MMM d, yyyy"),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Quality Metrics</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Metric</DialogTitle>
              <DialogDescription>
                Define a new metric to track for this data product.
              </DialogDescription>
            </DialogHeader>
            <MetricDefinitionForm
              dataProductId={dataProductId}
              onSuccess={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Completeness"
          value={metrics.current?.completeness ?? 0}
          description="Percentage of non-null values"
        />
        <MetricCard
          title="Accuracy"
          value={metrics.current?.accuracy ?? 0}
          description="Percentage of accurate data points"
        />
        <MetricCard
          title="Timeliness"
          value={metrics.current?.timeliness ?? 0}
          description="Data freshness score"
        />
      </div>

      {metrics.current.customMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.current.customMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.name}
              value={0} // TODO: Implement custom metric value calculation
              description={metric.description || "Custom metric"}
              threshold={metric.threshold}
            />
          ))}
        </div>
      )}

      {formattedData.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Historical Trends</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" className="text-foreground" />
                  <YAxis domain={[0, 100]} className="text-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completeness"
                    stroke="#4CAF50"
                    name="Completeness"
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2196F3"
                    name="Accuracy"
                  />
                  <Line
                    type="monotone"
                    dataKey="timeliness"
                    stroke="#F44336"
                    name="Timeliness"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No historical data available
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  threshold?: number;
}

function MetricCard({ title, value, description, threshold }: MetricCardProps) {
  const isBelow = threshold !== undefined && value < threshold;

  return (
    <Card>
      <CardContent className="pt-6">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="mt-2 flex items-baseline">
          <div className={`text-3xl font-semibold ${isBelow ? 'text-destructive' : 'text-foreground'}`}>
            {value}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
        {threshold && (
          <p className="text-xs text-muted-foreground mt-1">
            Threshold: {threshold}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}