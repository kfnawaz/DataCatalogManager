import { useQuery } from "@tanstack/react-query";
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
import { format } from "date-fns";

interface MetricHistory {
  timestamp: string;
  completeness: number;
  accuracy: number;
  timeliness: number;
}

interface MetricData {
  current: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    customMetrics?: Record<string, any>;
  };
  history: MetricHistory[];
}

interface QualityMetricsProps {
  dataProductId: number | null;
}

export default function QualityMetrics({ dataProductId }: QualityMetricsProps) {
  const { data: metrics, isLoading } = useQuery<MetricData>({
    queryKey: ["/api/quality-metrics", dataProductId],
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

      {formattedData.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Historical Trends</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
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
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="mt-2 flex items-baseline">
          <div className="text-3xl font-semibold">{value}%</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}